from rest_framework import serializers

from .models import ScheduledInterview


class ScheduledInterviewSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="application.job.title", read_only=True)
    company = serializers.CharField(source="application.job.company.name", read_only=True)
    student_name = serializers.SerializerMethodField()
    application_id = serializers.IntegerField(source="application.id", read_only=True)
    student_response_display = serializers.CharField(source="get_student_response_display", read_only=True)

    class Meta:
        model = ScheduledInterview
        fields = [
            "id", "application_id", "job_title", "company", "student_name",
            "round_name", "scheduled_at", "duration_minutes", "mode",
            "location_or_link", "notes", "status",
            "student_response", "student_response_display", "student_message", "created_at",
        ]
        read_only_fields = ["id", "created_at", "student_response", "student_response_display"]

    def get_student_name(self, obj):
        student = obj.application.student
        return student.get_full_name() or student.username
