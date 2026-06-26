from django.conf import settings
from django.db import models


class ScheduledInterview(models.Model):
    ONLINE = "online"
    OFFLINE = "offline"
    PHONE = "phone"
    MODE_CHOICES = ((ONLINE, "Online"), (OFFLINE, "Offline"), (PHONE, "Phone"))

    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    STATUS_CHOICES = ((SCHEDULED, "Scheduled"), (COMPLETED, "Completed"), (CANCELLED, "Cancelled"))

    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINE_REQUESTED = "decline_requested"
    RESPONSE_CHOICES = (
        (PENDING, "Awaiting response"),
        (CONFIRMED, "Confirmed"),
        (DECLINE_REQUESTED, "Reschedule requested"),
    )

    application = models.ForeignKey(
        "jobs.Application", on_delete=models.CASCADE, related_name="scheduled_interviews",
    )
    round_name = models.CharField(max_length=100, help_text="e.g. 'Technical Interview', 'HR Round'")
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default=ONLINE)
    location_or_link = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=SCHEDULED)

    student_response = models.CharField(max_length=20, choices=RESPONSE_CHOICES, default=PENDING)
    student_message = models.CharField(max_length=255, blank=True, help_text="Student's note, e.g. reason for reschedule request")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.round_name} - {self.application} @ {self.scheduled_at:%Y-%m-%d %H:%M}"
