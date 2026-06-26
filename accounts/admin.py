from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Skill, StudentSkill, User


@admin.register(User)
class CampusUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "branch", "university", "is_staff")
    list_filter = ("role", "branch")
    fieldsets = UserAdmin.fieldsets + (
        ("Campus profile", {
            "fields": ("role", "university", "branch", "cgpa", "bio", "resume_text",
                       "graduation_year", "company_name", "company"),
        }),
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(StudentSkill)
class StudentSkillAdmin(admin.ModelAdmin):
    list_display = ("student", "skill", "level")
    list_filter = ("skill",)
