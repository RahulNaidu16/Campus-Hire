from django.urls import path

from .views import AnalyticsOverviewView, RecruiterAnalyticsView

urlpatterns = [
    path("overview/", AnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("recruiter/", RecruiterAnalyticsView.as_view(), name="analytics-recruiter"),
]
