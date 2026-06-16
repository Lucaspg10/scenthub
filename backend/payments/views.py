from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from .models import Order
from .serializers import OrderSerializer
from audit.models import WebhookLog # Core architecture verification


class OrderViewSet(viewsets.ModelViewSet):
    """
    Manages user checkout sessions and order state tracking.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters orders so users can only access their own data.
        """
        return Order.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Intercepts the POST request to construct the order properly.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {"mensagem": "Pedido iniciado com sucesso. Aguardando pagamento.", "dados": serializer.data},
                status=status.HTTP_201_CREATED
            )

        return Response(
            {"erro": "Falha na validação dos dados do pedido.", "detalhes": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class MockWebhookView(APIView):
    """
    Simulates an incoming webhook request from Mercado Pago for development/academic evaluation.
    Bypasses authentication as external webhooks do not possess user tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Intercepts the simulated payload, updates the order status, and writes to the audit log.
        """
        payload = request.data
        order_id = payload.get("order_id")

        try:
            order = Order.objects.get(id=order_id)

            # Mutates the state to paid
            order.status = 'PAID'
            order.save()

            # Writes the untampered payload to the system's black box
            WebhookLog.objects.create(
                provider='MERCADO_PAGO',
                event_type='mock.payment.approved',
                raw_payload=payload,
                order_id=order.id,
                is_processed=True
            )

            return Response(
                {"mensagem": f"Pagamento simulado aprovado. Pedido #{order.id} atualizado."},
                status=status.HTTP_200_OK
            )

        except ValidationError as e:
            # Captures the exception raised by your pre_save signal if stock is insufficient
            return Response(
                {"erro": "Falha no processamento do estoque para o pedido.", "detalhes": e.message},
                status=status.HTTP_409_CONFLICT
            )
        except Order.DoesNotExist:
            return Response(
                {"erro": "Pedido não encontrado no banco de dados."},
                status=status.HTTP_404_NOT_FOUND
            )
