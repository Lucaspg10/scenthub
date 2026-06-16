from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, WebhookLogViewSet

router = DefaultRouter()
router.register(r'logs', AuditLogViewSet, basename='auditlog')
router.register(r'webhooks', WebhookLogViewSet, basename='webhooklog')

urlpatterns = [
    path('', include(router.urls)),
]
