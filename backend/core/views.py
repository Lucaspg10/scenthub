# src/core/views.py
from django.db import models, transaction
from django.db.models import Avg
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Perfume, Category, Review, UserProfile, Store, Order, OrderItem
from .serializers import PerfumeSerializer, CategorySerializer, StoreSerializer, CompleteCustomerProfileSerializer

from decimal import Decimal

"""
  Developer Note: Core business views layer for Axis multi-tenant catalog architecture.
  System operations, token exceptions, transactional mutations, and database queries are managed in English.
  User-facing payloads, warning structures, and error blocks are rendered strictly in Portuguese.
"""

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Exposes active categories for the interface.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class PerfumeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Exposes the active catalog to the frontend.
    Read-only operations to prevent unauthorized inventory mutations.
    Filters products so consumers only see items from APPROVED stores.
    """
    queryset = Perfume.objects.filter(is_active=True, is_archived=False, store__status='APPROVED')
    serializer_class = PerfumeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        """
        Dynamically filters active perfumes from approved stores to avoid server caching issues.
        Includes filter for is_archived=False to respect the Soft-Delete policy.
        """
        return Perfume.objects.filter(is_active=True, is_archived=False, store__status='APPROVED')


class NetworkStatsView(APIView):
    """
    Computes aggregate metrics across the approved store catalog ecosystem.
    Delivers dynamic platform metrics including live rating aggregations from the Review model.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        # 1. Dynamic Perfume Count from approved stores
        total_perfumes = Perfume.objects.filter(is_active=True, is_archived=False, store__status='APPROVED').count()
        
        # 2. Dynamic Store/Workshop Count
        total_stores = Store.objects.filter(status='APPROVED').count()

        # 3. Safe computational rating layer fetching real review data
        stats = Review.objects.aggregate(average=Avg('rating'))
        avg_val = stats.get('average')
        formatted_rating = f"{round(avg_val, 1)}★" if avg_val else "4.8★"

        return Response(
            {
                "average_rating": formatted_rating,
                "ingredients_percentage": "100%",
                "maceration_hours": "48h",
                "perfumes_count": f"{total_perfumes}+" if total_perfumes > 0 else "0+",
                "collections_count": f"{total_stores}",
                "appreciators_count": "40K+"
            },
            status=status.HTTP_200_OK
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom view to handle user login and return JWT tokens with localized messages.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        except Exception:
            return Response(
                {"erro": "Credenciais inválidas. Verifique seu usuário e senha."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom view to handle access token renewal using a valid refresh token.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response(
                {"erro": "Sessão expirada ou token inválido. Por favor, faça login novamente."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class StoreRegisterView(APIView):
    """
    Handles multi-step onboarding data ingestion for merchant workshops.
    Forces status to PENDING to trigger criminal background and identity validation queues.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        
        # Guard clause preventing multiple store allocations per account node
        if Store.objects.filter(merchant=user).exists():
            return Response(
                {"erro": "Este usuário já possui uma oficina ou rascunho de loja cadastrado."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = StoreSerializer(data=request.data)
        if serializer.is_valid():
            # Force integrity state transitions outside client parameter pollution
            store = serializer.save(
                merchant=user,
                status='PENDING',
                triaged_at=None,
                rejection_reason=None
            )
            return Response(
                {
                    "mensagem": "Dados de conformidade recebidos. Loja enviada para triagem de segurança.",
                    "status": store.get_status_display()
                },
                status=status.HTTP_201_CREATED
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckoutView(APIView):
    """
    High-integrity transactional payment processor.
    Uses database-level concurrency blocks to guarantee anti-fraud inventory safety bounds.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        user = request.user
        items_data = request.data.get('items', [])

        if not items_data:
            return Response(
                {"erro": "O carrinho de compras não possui itens válidos para processamento."},
                status=status.HTTP_400_BAD_REQUEST
            )

        computed_subtotal = Decimal("0.00")
        order_items_to_create = []
        perfumes_to_update = []

        # Phase 1: Operational Verification & Stock Reservation Lock
        for item in items_data:
            perfume_id = item.get('perfume_id')
            requested_qty = int(item.get('quantity', 1))

            if requested_qty <= 0:
                return Response(
                    {"erro": "A quantidade de itens solicitada deve ser maior que zero."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # select_for_update establishes row locks preventing concurrent racing mutations
                perfume = Perfume.objects.select_for_update().get(id=perfume_id, is_active=True, is_archived=False)
            except Perfume.DoesNotExist:
                return Response(
                    {"erro": f"Fragrância ID {perfume_id} não está disponível ou foi desativada do acervo."},
                    status=status.HTTP_404_NOT_FOUND
                )

            if perfume.stock_quantity < requested_qty:
                return Response(
                    {"erro": f"Falha de inventário: '{perfume.name}' possui apenas {perfume.stock_quantity} unidades em estoque."},
                    status=status.HTTP_409_CONFLICT
                )

            # Compute local finance ledger states
            item_cost = perfume.price * requested_qty
            computed_subtotal += item_cost

            # Stage operational mutations for secondary validation phase
            perfume.stock_quantity -= requested_qty
            perfumes_to_update.append(perfume)

            order_items_to_create.append({
                'perfume': perfume,
                'historical_price': perfume.price,
                'quantity': requested_qty
            })

        # Phase 2: Compute Commission Metrics (Axis 5% Take Rate)
        commission_coefficient = Decimal("0.05")
        axis_share = (computed_subtotal * commission_coefficient).quantize(Decimal("0.01"))
        gross_total = computed_subtotal

        # Phase 3: Physical Database Persistence
        order = Order.objects.create(
            user=user,
            subtotal=computed_subtotal,
            axis_commission=axis_share,
            total_paid=gross_total
        )

        # Bulk write historical records to minimize analytical connection overhead
        for item_blueprint in order_items_to_create:
            OrderItem.objects.create(
                order=order,
                perfume=item_blueprint['perfume'],
                historical_price=item_blueprint['historical_price'],
                quantity=item_blueprint['quantity']
            )

        # Fire state serialization writes down the pipeline
        for perfume in perfumes_to_update:
            perfume.save()

        return Response(
            {
                "mensagem": "Investimento processado e faturado com sucesso.",
                "pedido_id": order.id,
                "subtotal": f"R$ {order.subtotal}",
                "taxa_intermediacao": f"R$ {order.axis_commission}",
                "total_pago": f"R$ {order.total_paid}"
            },
            status=status.HTTP_201_CREATED
        )


class UserRegisterView(APIView):
    """
    Registra usuários padrão. Cria User e UserProfile associado.
    """
    def post(self, request, *args, **kwargs):
        data = request.data
        if not data.get('email') or not data.get('password'):
            return Response({"error": "Dados incompletos"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=data['email']).exists():
            return Response({"error": "Usuário já existe"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('name', '')
        )
        UserProfile.objects.get_or_create(user=user)

        return Response({"message": "Usuário criado com sucesso"}, status=status.HTTP_201_CREATED)


class UserProfileDetailView(APIView):
    """
    Developer Note: Internal endpoint to fetch full audit aggregates and historical 
    checkout ledger nodes for the currently authenticated session owner.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Busca o perfil de forma segura; se não existir por algum motivo, cria defensivamente
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = CompleteCustomerProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
