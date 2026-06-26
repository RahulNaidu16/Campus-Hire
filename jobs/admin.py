from django.contrib import admin

from .models import Application, ApplicationStatusHistory, Company, Job, SavedJob


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "initial", "industry", "hq_location", "color")
    search_fields = ("name", "industry")


class StatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ("status", "note", "changed_by", "changed_at")


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "location", "job_type", "salary_lpa", "openings", "is_active", "posted_at")
    list_filter = ("job_type", "location", "is_active")
    search_fields = ("title", "company__name")
    filter_horizontal = ("skills",)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "job", "status", "applied_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("student__username", "job__title")
    inlines = [StatusHistoryInline]


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ("student", "job", "saved_at")
