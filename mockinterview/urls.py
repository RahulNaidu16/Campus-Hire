from django.urls import path

from .views import (
    AvailableRolesView,
    CompleteSessionView,
    MockInterviewStatsView,
    SessionDetailView,
    SessionHistoryView,
    StartSessionView,
    SubmitAnswerView,
)

urlpatterns = [
    path("roles/", AvailableRolesView.as_view(), name="mock-roles"),
    path("stats/", MockInterviewStatsView.as_view(), name="mock-stats"),
    path("sessions/", StartSessionView.as_view(), name="mock-session-start"),
    path("sessions/history/", SessionHistoryView.as_view(), name="mock-session-history"),
    path("sessions/<int:session_id>/", SessionDetailView.as_view(), name="mock-session-detail"),
    path("sessions/<int:session_id>/answer/", SubmitAnswerView.as_view(), name="mock-session-answer"),
    path("sessions/<int:session_id>/complete/", CompleteSessionView.as_view(), name="mock-session-complete"),
]
