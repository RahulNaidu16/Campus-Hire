from django.urls import path

from .views import ResumeAnalyzeView, ResumeFileDownloadView

urlpatterns = [
    path("analyze/", ResumeAnalyzeView.as_view(), name="resume-analyze"),
    path("file/<int:user_id>/", ResumeFileDownloadView.as_view(), name="resume-file-download"),
]
