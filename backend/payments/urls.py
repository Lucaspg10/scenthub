from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, MockWebhookView


router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),

    path('webhook/mock/', MockWebhookView.as_view(), name='mock-webhook'),
]
