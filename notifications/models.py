from django.conf import settings
from django.db import models


class Notification(models.Model):
    APPLICATION_STATUS = "application_status"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_REMINDER = "interview_reminder"
    DEADLINE_REMINDER = "deadline_reminder"
    GENERAL = "general"
    TYPE_CHOICES = (
        (APPLICATION_STATUS, "Application status changed"),
        (INTERVIEW_SCHEDULED, "Interview scheduled"),
        (INTERVIEW_REMINDER, "Interview reminder"),
        (DEADLINE_REMINDER, "Job deadline reminder"),
        (GENERAL, "General"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notif_type = models.CharField(max_length=24, choices=TYPE_CHOICES, default=GENERAL)
    title = models.CharField(max_length=150)
    message = models.CharField(max_length=255, blank=True)

    related_job = models.ForeignKey("jobs.Job", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    related_application = models.ForeignKey(
        "jobs.Application", on_delete=models.SET_NULL, null=True, blank=True, related_name="+",
    )

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.user.username}] {self.title}"
