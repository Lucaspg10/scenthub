from django.db import models
from django.contrib.auth.models import User


class Order(models.Model):
    """
    Represents the core financial transaction record for a user checkout session.
    Tracks state transitions and final settlement values.
    """
    STATUS_CHOICES = [
          ('PENDING', 'Pendente de Pagamento'),
          ('PROCESSING', 'Processando / Em Análise'),
          ('PAID', 'Pago / Aprovado'),
          ('CANCELLED', 'Cancelado'),
          ('REFUNDED', 'Reembolsado'),
    ]

    METHOD_CHOICES = [
        ('CREDIT_CARD', 'Cartão de Crédito'),
        ('PIX', 'Pix'),
        ('BOLETO', 'Boleto Bancário'),
    ]

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders", blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=15, choices=METHOD_CHOICES)
    transaction_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True, help_text="Motivo de falha enviado pelo gateway se o pagamento for recusado.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido #{self.id} - [{self.get_status_display()}] - R$ {self.total_amount}"


class OrderItem(models.Model):
    """
    Snapshot of a product transaction at the exact moment of purchase.
    Preserves audit data independently of product model mutations.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    perfume = models.ForeignKey('core.Perfume', on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "Item do Pedido"
        verbose_name_plural = "Itens do Pedido"

    def __str__(self):
        return f"{self.quantity}x {self.perfume.name} (R$ {self.price_at_purchase})"
