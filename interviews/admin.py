from django.contrib import admin

from .models import ScheduledInterview


@admin.register(ScheduledInterview)
class ScheduledInterviewAdmin(admin.ModelAdmin):
    list_display = ("application", "round_name", "scheduled_at", "mode", "status")
    list_filter = ("mode", "status")
