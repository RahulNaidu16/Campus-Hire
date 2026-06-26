from rest_framework import permissions


class IsPlatformAdmin(permissions.BasePermission):
    """Only Django staff/superusers (the same accounts that can use /admin/)
    may use these endpoints. This intentionally reuses Django's own
    is_staff/is_superuser flags rather than inventing a parallel role system."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))
