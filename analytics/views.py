from collections import OrderedDict

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Application, Job

User = get_user_model()

INTERVIEW_STAGES = [
    Application.APTITUDE_TEST, Application.TECHNICAL_INTERVIEW,
    Application.HR_INTERVIEW, Application.SELECTED,
]


class AnalyticsOverviewView(APIView):
    """Org-wide placement analytics, aggregated live from the database."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        students = User.objects.filter(role="student")
        participating = students.filter(applications__isnull=False).distinct()
        placed_students = students.filter(applications__status=Application.SELECTED).distinct()

        total_placed = placed_students.count()
        active_jobs = Job.objects.filter(is_active=True).count()
        participating_count = participating.count()

        avg_package = Job.objects.filter(
            applications__status=Application.SELECTED
        ).aggregate(avg=Avg("salary_lpa"))["avg"] or 0

        stats = [
            {"label": "Total Placed", "value": str(total_placed), "icon": "🎓"},
            {"label": "Avg Package", "value": f"{avg_package:.1f} LPA", "icon": "📈"},
            {"label": "Active Jobs", "value": str(active_jobs), "icon": "💼"},
            {"label": "Participating", "value": str(participating_count), "icon": "👥"},
        ]

        dept_rows = (
            placed_students.exclude(branch="")
            .values("branch")
            .annotate(placed=Count("id"))
            .order_by("-placed")
        )
        dept_data = [{"dept": row["branch"], "placed": row["placed"]} for row in dept_rows]

        monthly_data = self._monthly_funnel()

        hiring_rows = (
            Application.objects.filter(status=Application.SELECTED)
            .values("job__company__name")
            .annotate(hires=Count("id"))
            .order_by("-hires")[:6]
        )
        hiring_data = [{"company": row["job__company__name"], "hires": row["hires"]} for row in hiring_rows]

        if participating_count:
            placed_pct = round(total_placed / participating_count * 100)
        else:
            placed_pct = 0
        placement_ratio = [
            {"name": "Placed", "value": placed_pct},
            {"name": "In Process", "value": 100 - placed_pct},
        ]

        return Response({
            "stats": stats,
            "dept_data": dept_data,
            "monthly_data": monthly_data,
            "hiring_data": hiring_data,
            "placement_ratio": placement_ratio,
        })

    def _monthly_funnel(self):
        now = timezone.now()
        buckets = OrderedDict()
        cursor = now.replace(day=1)
        markers = []
        for _ in range(6):
            markers.append(cursor)
            prev_month = cursor.month - 1 or 12
            prev_year = cursor.year - 1 if cursor.month == 1 else cursor.year
            cursor = cursor.replace(year=prev_year, month=prev_month)
        markers.reverse()
        for m in markers:
            buckets[(m.year, m.month)] = {"month": m.strftime("%b"), "applications": 0, "interviews": 0}

        qs = Application.objects.values_list("applied_at", "status")
        for applied_at, status in qs:
            key = (applied_at.year, applied_at.month)
            if key in buckets:
                buckets[key]["applications"] += 1
                if status in INTERVIEW_STAGES:
                    buckets[key]["interviews"] += 1
        return list(buckets.values())


class RecruiterAnalyticsView(APIView):
    """Hiring statistics for the requesting recruiter's own jobs."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "recruiter":
            return Response({"detail": "Recruiter analytics are only available for recruiter accounts."}, status=400)

        jobs = Job.objects.filter(created_by=request.user)
        applications = Application.objects.filter(job__created_by=request.user)

        total_jobs = jobs.count()
        total_applications = applications.count()
        shortlisted = applications.filter(
            status__in=[Application.RESUME_SHORTLISTED, Application.APTITUDE_TEST,
                        Application.TECHNICAL_INTERVIEW, Application.HR_INTERVIEW]
        ).count()
        selected = applications.filter(status=Application.SELECTED).count()
        rejected = applications.filter(status=Application.REJECTED).count()

        cards = [
            {"label": "Total Jobs Posted", "value": total_jobs, "icon": "💼"},
            {"label": "Total Applications", "value": total_applications, "icon": "📨"},
            {"label": "Shortlisted Candidates", "value": shortlisted, "icon": "📋"},
            {"label": "Selected Candidates", "value": selected, "icon": "✅"},
            {"label": "Rejected Candidates", "value": rejected, "icon": "❌"},
        ]

        per_job_rows = (
            jobs.annotate(num_applications=Count("applications"))
            .values("title", "num_applications")
            .order_by("-num_applications")[:8]
        )
        applications_per_job = [{"job": r["title"], "applications": r["num_applications"]} for r in per_job_rows]

        funnel = [
            {"stage": "Applied", "count": total_applications},
            {"stage": "Shortlisted", "count": shortlisted},
            {"stage": "Selected", "count": selected},
        ]

        monthly_rows = self._recruiter_monthly(applications)

        return Response({
            "cards": cards,
            "applications_per_job": applications_per_job,
            "hiring_funnel": funnel,
            "monthly_activity": monthly_rows,
        })

    def _recruiter_monthly(self, applications):
        now = timezone.now()
        buckets = OrderedDict()
        cursor = now.replace(day=1)
        markers = []
        for _ in range(6):
            markers.append(cursor)
            prev_month = cursor.month - 1 or 12
            prev_year = cursor.year - 1 if cursor.month == 1 else cursor.year
            cursor = cursor.replace(year=prev_year, month=prev_month)
        markers.reverse()
        for m in markers:
            buckets[(m.year, m.month)] = {"month": m.strftime("%b"), "applications": 0}
        for applied_at in applications.values_list("applied_at", flat=True):
            key = (applied_at.year, applied_at.month)
            if key in buckets:
                buckets[key]["applications"] += 1
        return list(buckets.values())
