from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Application, Company, Job

from .permissions import IsPlatformAdmin
from .serializers import AdminRecruiterSerializer, AdminStudentSerializer

User = get_user_model()


class AdminListPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminOverviewView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        total_students = User.objects.filter(role="student").count()
        total_recruiters = User.objects.filter(role="recruiter").count()
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(is_active=True).count()
        total_applications = Application.objects.count()
        total_placed = User.objects.filter(
            role="student", applications__status=Application.SELECTED
        ).distinct().count()

        top_companies = (
            Company.objects.annotate(
                hires=Count("jobs__applications", filter=Q(jobs__applications__status=Application.SELECTED), distinct=True),
                postings=Count("jobs", distinct=True),
            )
            .order_by("-hires")[:5]
        )
        most_active_companies = [
            {"name": c.name, "hires": c.hires, "jobs_posted": c.postings} for c in top_companies
        ]

        return Response({
            "total_students": total_students,
            "total_recruiters": total_recruiters,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "total_placed": total_placed,
            "most_active_companies": most_active_companies,
        })


class AdminStudentListView(generics.ListAPIView):
    serializer_class = AdminStudentSerializer
    permission_classes = [IsPlatformAdmin]
    pagination_class = AdminListPagination

    def get_queryset(self):
        qs = User.objects.filter(role="student").annotate(
            applications_count=Count("applications", distinct=True),
            selected_count=Count(
                "applications", filter=Q(applications__status=Application.SELECTED), distinct=True,
            ),
        ).order_by("-date_joined")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
                | Q(first_name__icontains=search) | Q(last_name__icontains=search)
                | Q(university__icontains=search)
            )
        branch = self.request.query_params.get("branch")
        if branch:
            qs = qs.filter(branch=branch)
        return qs


class AdminRecruiterListView(generics.ListAPIView):
    serializer_class = AdminRecruiterSerializer
    permission_classes = [IsPlatformAdmin]
    pagination_class = AdminListPagination

    def get_queryset(self):
        qs = User.objects.filter(role="recruiter").select_related("company").annotate(
            jobs_count=Count("posted_jobs", distinct=True),
        ).order_by("-date_joined")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
                | Q(first_name__icontains=search) | Q(last_name__icontains=search)
                | Q(company_name__icontains=search)
            )
        return qs


class AdminUserDetailView(APIView):
    """Admins can deactivate/reactivate or delete a student or recruiter account."""

    permission_classes = [IsPlatformAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk, role__in=["student", "recruiter"])
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        if "is_active" in request.data:
            user.is_active = bool(request.data["is_active"])
            user.save(update_fields=["is_active"])

        return Response({"id": user.id, "is_active": user.is_active})

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk, role__in=["student", "recruiter"])
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        user.delete()
        return Response(status=204)
