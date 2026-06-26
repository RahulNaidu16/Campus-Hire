from django.urls import path

from .views import ApplicationListView, ApplicationStatusUpdateView

urlpatterns = [
    path("", ApplicationListView.as_view(), name="application-list"),
    path("<int:pk>/status/", ApplicationStatusUpdateView.as_view(), name="application-status-update"),
]
