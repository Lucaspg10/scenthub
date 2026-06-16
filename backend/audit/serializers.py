from rest_framework import serializers
from .models import AuditLog, WebhookLog


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializes standard system audit logs.
    """
    class Meta:
        model = AuditLog
        fields = '__all__'


class WebhookLogSerializer(serializers.ModelSerializer):
    """
    Serializes raw webhook payloads from external gateways.
    """
    class Meta:
        model = WebhookLog
        fields = '__all__'
