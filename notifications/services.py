"""Small helper so other apps can create notifications (and, alongside them,
send an email) without importing the Notification model/serializer everywhere.

Emails are sent via Django's email backend, which defaults to printing to the
console/log (see settings.EMAIL_BACKEND) - no real SMTP credentials are
required for this to work locally or for demo purposes. Set
DJANGO_EMAIL_BACKEND=smtp plus the EMAIL_HOST_* env vars to send real email.
"""

import logging

from django.core.mail import send_mail
from django.conf import settings

from .models import Notification

logger = logging.getLogger(__name__)


def notify(user, notif_type, title, message="", related_job=None, related_application=None, send_email=True):
    notification = Notification.objects.create(
        user=user,
        notif_type=notif_type,
        title=title,
        message=message,
        related_job=related_job,
        related_application=related_application,
    )

    if send_email and user.email:
        _send_notification_email(user, title, message)

    return notification


def _send_notification_email(user, title, message):
    try:
        send_mail(
            subject=f"Campus Hire: {title}",
            message=message or title,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        # Email is a nice-to-have alongside the in-app notification, which is
        # always created regardless - never let an email failure break the
        # actual request (e.g. an application status update).
        logger.exception("Failed to send notification email to %s", user.email)
