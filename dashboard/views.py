from collections import OrderedDict

from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from interviews.models import ScheduledInterview
from interviews.serializers import ScheduledInterviewSerializer
from jobs.models import Application, Job, SavedJob
from jobs.serializers import JobSerializer
from mlengine.improvement_tips import build_improvement_tips
from mlengine.placement_model import predict_placement_probability
from mlengine.recommender import compute_match_scores, recommend_jobs
from mlengine.skill_gap import detect_skill_gap
from notifications.models import Notification

User = get_user_model()

# Reaching any of these stages counts as "got an interview call" for stats purposes.
INTERVIEW_STAGES = [
    Application.APTITUDE_TEST, Application.TECHNICAL_INTERVIEW,
    Application.HR_INTERVIEW, Application.SELECTED,
]


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "student":
            return Response({"detail": "Dashboard is only available for student accounts."}, status=400)

        applications = Application.objects.filter(student=user).select_related("job", "job__company")
        num_applications = applications.count()
        num_interviews = applications.filter(status__in=INTERVIEW_STAGES).count()

        active_jobs = Job.objects.filter(is_active=True).select_related("company").prefetch_related("skills")
        scores = compute_match_scores(user, list(active_jobs))
        avg_match = sum(scores.values()) / len(scores) if scores else 0
        eligible_jobs = sum(1 for v in scores.values() if v >= 60)

        placement_probability = predict_placement_probability(
            avg_match_pct=avg_match,
            num_applications=num_applications,
            num_interviews=num_interviews,
            cgpa=user.cgpa or 0,
        )

        stats = [
            {"label": "Applications", "value": str(num_applications), "icon": "💼"},
            {"label": "Eligible Jobs", "value": str(eligible_jobs), "icon": "🎯"},
            {"label": "Interview Calls", "value": str(num_interviews), "icon": "📅"},
            {"label": "Placement Probability", "value": f"{placement_probability}%", "icon": "✨"},
        ]

        activity_data = self._monthly_activity(applications)

        skills = [
            {"name": link.skill.name, "level": link.level}
            for link in user.student_skills.select_related("skill").order_by("-level")[:8]
        ]

        activity_feed = [
            {
                "status": app.get_status_display(),
                "role": app.job.title,
                "company": app.job.company.name,
                "date": app.updated_at.date().isoformat(),
            }
            for app in applications.order_by("-updated_at")[:6]
        ]

        recommended = recommend_jobs(user, active_jobs, limit=4)
        applied_ids = set(applications.values_list("job_id", flat=True))
        saved_ids = set(SavedJob.objects.filter(student=user).values_list("job_id", flat=True))
        recommended_jobs = JobSerializer(
            recommended, many=True, context={"applied_job_ids": applied_ids, "saved_job_ids": saved_ids, "request": request},
        ).data

        skill_gap = detect_skill_gap(user, active_jobs)

        placed_avg_cgpa = User.objects.filter(
            role="student", applications__status=Application.SELECTED
        ).distinct().aggregate(avg=Avg("cgpa"))["avg"]
        improvement_tips = build_improvement_tips(
            avg_match=avg_match,
            num_applications=num_applications,
            num_interviews=num_interviews,
            cgpa=user.cgpa,
            placed_avg_cgpa=placed_avg_cgpa,
        )

        saved_jobs_count = SavedJob.objects.filter(student=user).count()
        unread_notifications = Notification.objects.filter(user=user, is_read=False).count()

        upcoming = ScheduledInterview.objects.filter(
            application__student=user, scheduled_at__gte=timezone.now(), status=ScheduledInterview.SCHEDULED,
        ).select_related("application__job__company")[:5]
        upcoming_interviews = ScheduledInterviewSerializer(upcoming, many=True).data

        return Response({
            "greeting_name": user.first_name or user.username,
            "stats": stats,
            "activity_data": activity_data,
            "skills": skills,
            "activity_feed": activity_feed,
            "recommended_jobs": recommended_jobs,
            "placement_probability": placement_probability,
            "skill_gap": skill_gap,
            "improvement_tips": improvement_tips,
            "saved_jobs_count": saved_jobs_count,
            "unread_notifications": unread_notifications,
            "upcoming_interviews": upcoming_interviews,
        })

    def _monthly_activity(self, applications):
        """Build the last 7 calendar months (ending with the current one)."""
        now = timezone.now()
        buckets = OrderedDict()
        cursor = now.replace(day=1)
        markers = []
        for _ in range(7):
            markers.append(cursor)
            prev_month = cursor.month - 1 or 12
            prev_year = cursor.year - 1 if cursor.month == 1 else cursor.year
            cursor = cursor.replace(year=prev_year, month=prev_month)
        markers.reverse()

        for m in markers:
            buckets[(m.year, m.month)] = {"month": m.strftime("%b"), "applications": 0, "interviews": 0}

        for app in applications:
            key = (app.applied_at.year, app.applied_at.month)
            if key in buckets:
                buckets[key]["applications"] += 1
                if app.status in INTERVIEW_STAGES:
                    buckets[key]["interviews"] += 1

        return list(buckets.values())
