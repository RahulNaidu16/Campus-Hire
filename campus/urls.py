"""
URL configuration for campus project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(request):
    return JsonResponse({
        "status": "ok",
        "service": "Campus Hire API",
        "endpoints": {
            "auth": "/api/auth/",
            "jobs": "/api/jobs/",
            "applications": "/api/applications/",
            "dashboard": "/api/dashboard/",
            "analytics": "/api/analytics/",
            "resume": "/api/resume/",
            "notifications": "/api/notifications/",
            "interviews": "/api/interviews/",
            "mockinterview": "/api/mockinterview/",
            "admin_api": "/api/admin/",
            "admin": "/admin/",
        },
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/auth/', include('accounts.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/applications/', include('jobs.application_urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/resume/', include('resumeai.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/interviews/', include('interviews.urls')),
    path('api/mockinterview/', include('mockinterview.urls')),
    path('api/admin/', include('adminpanel.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
