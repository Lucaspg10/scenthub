from django.db import models
from django.contrib.auth.models import User


class AuditLog(models.Model):
    """
    Tracks critical master data modifications across the platform.
    Used for general compliance, price tracking, and inventory auditing.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Criação'),
        ('UPDATE', 'Alteração'),
        ('DELETE', 'Exclusão'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="audit_logs")
    app_label = models.CharField(max_length=100, help_text="The app where the model belongs (e.g., 'core', 'payments').")
    model_name = models.CharField(max_length=100, help_text="The target database table name.")
    object_id = models.PositiveIntegerField(help_text="Primary key identifier of the modified row.")

    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    changes_payload = models.JSONField(help_text="Key-value mapping of modified field states.")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de Auditoria Geral"
        verbose_name_plural = "Logs de Auditoria Geral"
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.get_action_display()}] {self.app_label}.{self.model_name} #{self.object_id} por {self.user.username if self.user else 'Sistema'}"


class WebhookLog(models.Model):
    """
    Stores untampered raw HTTP response payloads incoming from external financial APIs.
    Essential for tracing transaction failures and validating payment security.
    """
    PROVIDER_CHOICES = [
        ('STRIPE', 'Stripe'),
        ('MERCADO_PAGO', 'Mercado Pago'),
    ]

    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    event_type = models.CharField(max_length=255, blank=True, null=True, help_text="The raw event header or type identifier.")
    raw_payload = models.JSONField(help_text="Full, untampered raw body content received from the payment gateway.")
    order_id = models.PositiveIntegerField(blank=True, null=True, db_index=True, help_text="Extracted order ID from the payload.")
    is_processed = models.BooleanField(default=False, help_text="Tracks whether the signal handler executed successfully.")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de Webhook"
        verbose_name_plural = "Logs de Webhooks"
        ordering = ['-timestamp']

    def __str__(self):
        return f"Webhook [{self.get_provider_display()}] - Evento: {self.event_type or 'RAW'} - Pedido #{self.order_id}"
