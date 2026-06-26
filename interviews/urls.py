from django.urls import path

from .views import RespondToInterviewView, ScheduledInterviewListCreateView

urlpatterns = [
    path("", ScheduledInterviewListCreateView.as_view(), name="scheduled-interview-list"),
    path("<int:pk>/respond/", RespondToInterviewView.as_view(), name="scheduled-interview-respond"),
]
