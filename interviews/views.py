from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Application
from notifications.services import notify

from .models import ScheduledInterview
from .serializers import ScheduledInterviewSerializer


class ScheduledInterviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduledInterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = ScheduledInterview.objects.select_related(
            "application", "application__job", "application__job__company", "application__student",
        )
        if user.role == "recruiter":
            return qs.filter(application__job__created_by=user)
        return qs.filter(application__student=user, scheduled_at__gte=timezone.now() - timezone.timedelta(days=1))

    def perform_create(self, serializer):
        if self.request.user.role != "recruiter":
            raise PermissionDenied("Only recruiters can schedule interviews.")

        application_id = self.request.data.get("application")
        try:
            application = Application.objects.select_related("job", "job__company", "student").get(
                pk=application_id, job__created_by=self.request.user,
            )
        except Application.DoesNotExist:
            raise ValidationError({"application": "Application not found or not yours to schedule."})

        interview = serializer.save(application=application, created_by=self.request.user)

        notify(
            user=application.student,
            notif_type="interview_scheduled",
            title=f"Interview scheduled: {interview.round_name}",
            message=f"{application.job.company.name} scheduled your {interview.round_name} for "
                    f"{interview.scheduled_at:%d %b %Y, %I:%M %p}.",
            related_job=application.job,
            related_application=application,
        )
        return interview


class RespondToInterviewView(APIView):
    """Student confirms or requests a reschedule for a recruiter-scheduled interview."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != "student":
            return Response({"detail": "Only the invited student can respond to an interview."}, status=403)

        try:
            interview = ScheduledInterview.objects.select_related(
                "application__job__company", "application__job__created_by",
            ).get(pk=pk, application__student=request.user)
        except ScheduledInterview.DoesNotExist:
            return Response({"detail": "Interview not found."}, status=404)

        response = request.data.get("response")
        if response not in [ScheduledInterview.CONFIRMED, ScheduledInterview.DECLINE_REQUESTED]:
            return Response({"detail": "response must be 'confirmed' or 'decline_requested'."}, status=400)

        interview.student_response = response
        interview.student_message = request.data.get("message", "")[:255]
        interview.save(update_fields=["student_response", "student_message"])

        recruiter = interview.application.job.created_by
        if recruiter:
            student_name = request.user.get_full_name() or request.user.username
            if response == ScheduledInterview.CONFIRMED:
                notify(
                    user=recruiter, notif_type="general",
                    title=f"{student_name} confirmed: {interview.round_name}",
                    message=f"{student_name} confirmed attendance for {interview.round_name}.",
                    related_job=interview.application.job, related_application=interview.application,
                )
            else:
                notify(
                    user=recruiter, notif_type="general",
                    title=f"{student_name} requested a reschedule",
                    message=interview.student_message or f"{student_name} requested to reschedule {interview.round_name}.",
                    related_job=interview.application.job, related_application=interview.application,
                )

        return Response(ScheduledInterviewSerializer(interview).data)
