# src/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import (
    PerfumeViewSet, 
    CategoryViewSet, 
    CustomTokenObtainPairView, 
    CustomTokenRefreshView, 
    NetworkStatsView,
    StoreRegisterView,
    CheckoutView,
    UserRegisterView,
    UserProfileDetailView  # Injeção direta da view de perfil real
)

"""
Developer Note: Core routing layer for the Axis ecosystem.
Standardized endpoints for catalog operations, authentication, and platform analytics.
Added operational endpoints for merchant registration validation and atomic checkouts.
"""

router = DefaultRouter()
router.register(r'perfumes', PerfumeViewSet, basename='perfume')
router.register(r'categorias', CategoryViewSet, basename='categoria')

urlpatterns = [
    # API Catalog Routes (Relative path)
    path('', include(router.urls)),

    # Authentication and Identity Endpoints
    path('autenticacao/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('autenticacao/atualizar/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('usuarios/registrar/', UserRegisterView.as_view(), name='user-register'),
    path('usuarios/perfil/', UserProfileDetailView.as_view(), name='user-profile'), # Rota do painel de custódia
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),

    # Operational Intelligence Endpoints
    path('estatisticas/', NetworkStatsView.as_view(), name='network-stats'),

    # Merchant Validation & Onboarding Endpoints
    path('lojista/registrar/', StoreRegisterView.as_view(), name='store-register'),

    # Transactional Financial Checkout Endpoints
    path('checkout/', CheckoutView.as_view(), name='core-checkout'),
]
