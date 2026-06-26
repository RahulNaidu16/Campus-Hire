from django.urls import path

from .views import AdminOverviewView, AdminRecruiterListView, AdminStudentListView, AdminUserDetailView

urlpatterns = [
    path("overview/", AdminOverviewView.as_view(), name="admin-overview"),
    path("students/", AdminStudentListView.as_view(), name="admin-students"),
    path("recruiters/", AdminRecruiterListView.as_view(), name="admin-recruiters"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
]
