from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Handles the nested items within an Order snapshot.
    """
    class Meta:
        model = OrderItem
        fields = ['perfume', 'quantity', 'price_at_purchase']


class OrderSerializer(serializers.ModelSerializer):
    """
    Validates and serializes the checkout session data.
    """
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_amount', 'status', 'payment_method', 'transaction_id', 'items', 'created_at']

    def validate_total_amount(self, value):
        """
        Prevents tampering with the payload total amount.
        """
        if value <= 0:
            raise serializers.ValidationError("O valor total do pedido deve ser maior que zero.")
        return value
