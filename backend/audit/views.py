from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import AuditLog, WebhookLog
from .serializers import AuditLogSerializer, WebhookLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Strictly read-only endpoints for system administrators to review logs.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]


class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Exposes raw financial payloads for admin debugging.
    """
    queryset = WebhookLog.objects.all()
    serializer_class = WebhookLogSerializer
    permission_classes = [IsAdminUser]
