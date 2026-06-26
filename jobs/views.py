import csv

from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Skill
from mlengine.recommender import compute_match_scores, recommend_jobs
from notifications.services import notify

from .filters import JobFilter
from .models import Application, ApplicationStatusHistory, Company, Job, SavedJob
from .serializers import ApplicationSerializer, CompanySerializer, JobSerializer, SavedJobSerializer


class IsRecruiterOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == "recruiter")


def _saved_job_ids(user):
    if user.is_authenticated and user.role == "student":
        return set(SavedJob.objects.filter(student=user).values_list("job_id", flat=True))
    return None


def _applied_job_ids(user):
    if user.is_authenticated and user.role == "student":
        return set(Application.objects.filter(student=user).values_list("job_id", flat=True))
    return None


class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.filter(is_active=True).select_related("company").prefetch_related("skills", "applications")
    serializer_class = JobSerializer
    permission_classes = [IsRecruiterOrReadOnly]
    filterset_class = JobFilter
    pagination_class = None  # frontend renders the full filtered set in a responsive grid

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["applied_job_ids"] = _applied_job_ids(self.request.user)
        context["saved_job_ids"] = _saved_job_ids(self.request.user)
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        user = request.user
        jobs = list(queryset)

        if user.is_authenticated and user.role == "student":
            scores = compute_match_scores(user, jobs)
            for job in jobs:
                job.match_score = scores.get(job.id, 0)

        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        company = user.company
        if company is None and user.company_name:
            company, _ = Company.objects.get_or_create(
                name__iexact=user.company_name.strip(), defaults={"name": user.company_name.strip()},
            )
            user.company = company
            user.save(update_fields=["company"])
        if company is None:
            company = serializer.validated_data.get("company")
        if company is None:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Please set your company name in your profile before posting a job."})
        serializer.save(created_by=user, company=company)


class JobDetailView(generics.RetrieveAPIView):
    queryset = Job.objects.select_related("company").prefetch_related("skills")
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["applied_job_ids"] = _applied_job_ids(self.request.user)
        context["saved_job_ids"] = _saved_job_ids(self.request.user)
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if user.is_authenticated and user.role == "student":
            instance.match_score = compute_match_scores(user, [instance]).get(instance.id, 0)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class RecommendedJobsView(APIView):
    """ML-ranked job recommendations for the logged in student."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "student":
            return Response({"detail": "Only students receive job recommendations."}, status=400)

        limit = int(request.query_params.get("limit", 6))
        queryset = Job.objects.filter(is_active=True).select_related("company").prefetch_related("skills")
        ranked = recommend_jobs(request.user, queryset, limit=limit)

        context = {"applied_job_ids": _applied_job_ids(request.user), "saved_job_ids": _saved_job_ids(request.user), "request": request}
        serializer = JobSerializer(ranked, many=True, context=context)
        return Response(serializer.data)


class ApplyToJobView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "student":
            return Response({"detail": "Only students can apply to jobs."}, status=400)

        try:
            job = Job.objects.select_related("company").get(pk=pk, is_active=True)
        except Job.DoesNotExist:
            return Response({"detail": "Job not found."}, status=404)

        reasons = job.eligibility_reasons(request.user)
        if reasons:
            return Response({
                "detail": "You don't meet the eligibility criteria for this job.",
                "reasons": reasons,
            }, status=403)

        application, created = Application.objects.get_or_create(student=request.user, job=job)
        if not created:
            return Response({"detail": "You have already applied to this job."}, status=400)

        ApplicationStatusHistory.objects.create(application=application, status=Application.APPLIED)

        if job.created_by:
            notify(
                user=job.created_by, notif_type="general",
                title="New applicant",
                message=f"{request.user.get_full_name() or request.user.username} applied to {job.title}.",
                related_job=job, related_application=application,
            )

        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class ApplicationListView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.role == "recruiter":
            qs = Application.objects.filter(job__created_by=user).select_related(
                "job", "job__company", "student",
            ).prefetch_related("status_history")
            job_id = self.request.query_params.get("job_id")
            status_filter = self.request.query_params.get("status")
            if job_id:
                qs = qs.filter(job_id=job_id)
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        return Application.objects.filter(student=user).select_related(
            "job", "job__company",
        ).prefetch_related("status_history")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["include_student_profile"] = self.request.user.role == "recruiter"
        return context


class ApplicationStatusUpdateView(APIView):
    """Recruiter updates a candidate's hiring stage - records history and notifies the student."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != "recruiter":
            return Response({"detail": "Only recruiters can update application status."}, status=403)

        try:
            application = Application.objects.select_related("job", "student").get(
                pk=pk, job__created_by=request.user,
            )
        except Application.DoesNotExist:
            return Response({"detail": "Application not found."}, status=404)

        new_status = request.data.get("status")
        note = request.data.get("note", "")
        valid_statuses = dict(Application.STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response({"detail": "Invalid status."}, status=400)

        application.status = new_status
        application.save(update_fields=["status", "updated_at"])

        ApplicationStatusHistory.objects.create(
            application=application, status=new_status, note=note, changed_by=request.user,
        )

        notify(
            user=application.student, notif_type="application_status",
            title=f"Application update: {application.job.title}",
            message=f"Your application is now '{valid_statuses[new_status]}' at {application.job.company.name if hasattr(application.job, 'company') else ''}.",
            related_job=application.job, related_application=application,
        )

        return Response(ApplicationSerializer(application, context={"include_student_profile": True}).data)


class ApplicantsExportView(APIView):
    """CSV export of all applicants for a job the requesting recruiter owns."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        if request.user.role != "recruiter":
            return Response({"detail": "Only recruiters can export applicants."}, status=403)

        try:
            job = Job.objects.get(pk=job_id, created_by=request.user)
        except Job.DoesNotExist:
            return Response({"detail": "Job not found."}, status=404)

        applications = Application.objects.filter(job=job).select_related("student").order_by("-applied_at")

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{job.title}-applicants.csv"'
        writer = csv.writer(response)
        writer.writerow(["Name", "Email", "University", "Branch", "CGPA", "Status", "Applied At"])
        for app in applications:
            s = app.student
            writer.writerow([
                s.get_full_name() or s.username, s.email, s.university, s.branch,
                s.cgpa, app.get_status_display(), app.applied_at.strftime("%Y-%m-%d"),
            ])
        return response


class RecruiterJobListView(generics.ListAPIView):
    """All jobs (active + closed) created by the requesting recruiter, for their dashboard."""

    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        if self.request.user.role != "recruiter":
            return Job.objects.none()
        return Job.objects.filter(created_by=self.request.user).select_related("company").prefetch_related(
            "skills", "applications",
        )


class JobUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Recruiter edits, closes (is_active=False), or deletes their own job posting."""

    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(created_by=self.request.user)

    def perform_update(self, serializer):
        job = serializer.save()
        if "is_active" in self.request.data and not job.is_active and job.closed_at is None:
            job.closed_at = timezone.now()
            job.save(update_fields=["closed_at"])


class SavedJobListView(generics.ListAPIView):
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return SavedJob.objects.filter(student=self.request.user).select_related(
            "job", "job__company",
        ).prefetch_related("job__skills")


class ToggleSavedJobView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "student":
            return Response({"detail": "Only students can save jobs."}, status=400)
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"detail": "Job not found."}, status=404)

        saved_job, created = SavedJob.objects.get_or_create(student=request.user, job=job)
        if not created:
            saved_job.delete()
            return Response({"saved": False})
        return Response({"saved": True})


class CompanyListView(generics.ListAPIView):
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        from django.db.models import Count, Q as Qf
        return Company.objects.annotate(
            active_jobs_count=Count("jobs", filter=Qf(jobs__is_active=True), distinct=True),
            total_hires=Count("jobs__applications", filter=Qf(jobs__applications__status=Application.SELECTED), distinct=True),
        )


class CompanyDetailView(generics.RetrieveAPIView):
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from django.db.models import Count, Q as Qf
        return Company.objects.annotate(
            active_jobs_count=Count("jobs", filter=Qf(jobs__is_active=True), distinct=True),
            total_hires=Count("jobs__applications", filter=Qf(jobs__applications__status=Application.SELECTED), distinct=True),
        )

    def retrieve(self, request, *args, **kwargs):
        company = self.get_object()
        jobs = Job.objects.filter(company=company, is_active=True).select_related("company").prefetch_related("skills")
        context = {"applied_job_ids": _applied_job_ids(request.user), "saved_job_ids": _saved_job_ids(request.user), "request": request}
        if request.user.is_authenticated and request.user.role == "student":
            scores = compute_match_scores(request.user, list(jobs))
            for job in jobs:
                job.match_score = scores.get(job.id, 0)
        data = CompanySerializer(company).data
        data["jobs"] = JobSerializer(jobs, many=True, context=context).data
        return Response(data)


class JobMetaView(APIView):
    """Distinct facets used to populate the filter sidebar dynamically."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        jobs = Job.objects.filter(is_active=True)
        locations = sorted(set(jobs.values_list("location", flat=True)))
        job_types = sorted(set(jobs.values_list("job_type", flat=True)))
        skills = list(Skill.objects.order_by("name").values_list("name", flat=True))
        return Response({"locations": locations, "job_types": job_types, "skills": skills})
