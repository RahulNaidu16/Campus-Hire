from django.contrib import admin

from .models import InterviewQuestion, MockInterviewAnswer, MockInterviewSession


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ("role", "interview_type", "difficulty", "question_format")
    list_filter = ("role", "interview_type", "difficulty")
    search_fields = ("question_text",)


class AnswerInline(admin.TabularInline):
    model = MockInterviewAnswer
    extra = 0
    readonly_fields = ("question", "score", "answered_at")


@admin.register(MockInterviewSession)
class MockInterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("student", "role", "interview_type", "difficulty", "status", "average_score", "started_at")
    list_filter = ("interview_type", "difficulty", "status")
    inlines = [AnswerInline]
