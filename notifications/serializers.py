from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="related_job.title", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ["id", "notif_type", "title", "message", "job_title", "is_read", "created_at"]
