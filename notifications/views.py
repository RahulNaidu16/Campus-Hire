from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)[:50]
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            "results": NotificationSerializer(qs, many=True).data,
            "unread_count": unread_count,
        })


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
        return Response({"detail": "ok"})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "ok"})
