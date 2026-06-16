from django.contrib import admin
from .models import AuditLog, WebhookLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Administrative interface configuration for data mutations tracking logs.
    """
    list_display = ['id', 'action', 'app_label', 'model_name', 'object_id', 'user', 'timestamp']
    list_filter = ['action', 'app_label', 'timestamp']
    search_fields = ['model_name', 'object_id', 'user__username', 'changes_payload']
    date_hierarchy = 'timestamp'

    # Making audit data strictly read-only to guarantee compliance and log integrity
    readonly_fields = ['user', 'app_label', 'model_name', 'object_id', 'action', 'changes_payload', 'timestamp']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    """
    Administrative interface configuration for raw financial response payloads.
    """
    list_display = ['id', 'provider', 'event_type', 'order_id', 'is_processed', 'timestamp']
    list_filter = ['provider', 'is_processed', 'timestamp']
    search_fields = ['event_type', 'order_id', 'raw_payload']
    date_hierarchy = 'timestamp'

    # Ensuring raw evidence payload cannot be modified or forged inside the admin panel
    readonly_fields = ['provider', 'event_type', 'raw_payload', 'order_id', 'is_processed', 'timestamp']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
