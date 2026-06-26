from django.urls import path

from .views import (
    ApplicantsExportView,
    ApplyToJobView,
    CompanyDetailView,
    CompanyListView,
    JobDetailView,
    JobListCreateView,
    JobMetaView,
    JobUpdateDeleteView,
    RecommendedJobsView,
    RecruiterJobListView,
    SavedJobListView,
    ToggleSavedJobView,
)

urlpatterns = [
    path("meta/", JobMetaView.as_view(), name="job-meta"),
    path("recommendations/", RecommendedJobsView.as_view(), name="job-recommendations"),
    path("mine/", RecruiterJobListView.as_view(), name="job-mine"),
    path("saved/", SavedJobListView.as_view(), name="job-saved-list"),
    path("companies/", CompanyListView.as_view(), name="company-list"),
    path("companies/<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
    path("<int:pk>/apply/", ApplyToJobView.as_view(), name="job-apply"),
    path("<int:pk>/save/", ToggleSavedJobView.as_view(), name="job-save-toggle"),
    path("<int:job_id>/applicants/export/", ApplicantsExportView.as_view(), name="job-applicants-export"),
    path("<int:pk>/edit/", JobUpdateDeleteView.as_view(), name="job-edit"),
    path("<int:pk>/", JobDetailView.as_view(), name="job-detail"),
    path("", JobListCreateView.as_view(), name="job-list"),
]
