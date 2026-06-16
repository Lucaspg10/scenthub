# src/core/serializers.py
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils.text import slugify
from django.db.models import Avg, Count
from .models import Store, Category, Perfume, StoreEmployee, UserProfile, Review, Order, OrderItem

"""
Developer Note: English logs and metadata preserved for system configuration.
All internal serialization layers aligned with real core models.
User Interface / Error Messages: Kept entirely in Portuguese.
Integration Patch: Explicitly bound nested reviews and multi-tenant store lookups to prevent front-end hydration cracks.
"""

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ReviewFeedSerializer(serializers.ModelSerializer):
    """
    Serializer aninhado para alimentar o feed de auditoria e comentários do front-end.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    user = serializers.CharField(source='user.username', read_only=True) # Duplo mapeamento defensivo para o React

    class Meta:
        model = Review
        fields = ['id', 'username', 'user', 'rating', 'comment', 'created_at']


class PerfumeSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    store_name = serializers.CharField(source='store.name', read_only=True)
    shopName = serializers.CharField(source='store.name', read_only=True)
    reviews = ReviewFeedSerializer(many=True, read_only=True)

    class Meta:
        model = Perfume
        fields = [
            'id', 'store', 'store_name', 'shopName', 'name', 'slug', 'price', 'stock_quantity',
            'image_url', 'description', 'is_active', 'categories',
            'top_notes', 'heart_notes', 'base_notes', 'rating', 'review_count', 'reviews'
        ]
        read_only_fields = ['slug', 'rating', 'review_count', 'reviews']

    def validate_stock_quantity(self, value):
        if value < 0:
            raise ValidationError("O estoque não pode ser negativo.")
        return value

    def get_rating(self, obj):
        stats = obj.reviews.aggregate(avg_rating=Avg('rating'))
        if stats['avg_rating']:
            return round(stats['avg_rating'], 1)
        return 0.0

    def get_review_count(self, obj):
        count = obj.reviews.aggregate(count=Count('id'))['count']
        return count

    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        instance = Perfume(**validated_data)
        instance.slug = slugify(instance.name)
        instance.save()
        
        if categories:
            instance.categories.set(categories)
        return instance

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if 'name' in validated_data:
            instance.slug = slugify(instance.name)
            
        instance.save()
        
        if categories is not None:
            instance.categories.set(categories)
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'experience_level']


class StoreEmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = StoreEmployee
        fields = ['id', 'store', 'username', 'email', 'role', 'created_at']


class ProfileOrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='perfume.name', read_only=True)
    image_url = serializers.URLField(source='perfume.image_url', read_only=True)
    store_name = serializers.CharField(source='perfume.store.name', read_only=True)
    perfume_id = serializers.IntegerField(source='perfume.id', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'perfume_id', 'name', 'image_url', 'store_name', 'historical_price', 'quantity']

class CompleteCustomerProfileSerializer(serializers.ModelSerializer):
    """
    Unified serialization engine mapping user profile audit indicators, 
    historical checkout items, and multi-tenant store owner flags.
    """
    name = serializers.CharField(source='user.first_name', read_only=True) # <--- CAPTURA O NOME REAL DO USUÁRIO
    nickname = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email', read_only=True)
    experience_level = serializers.CharField(read_only=True)
    
    # Audit Aggregations directly from DB
    total_orders = serializers.SerializerMethodField()
    total_invested = serializers.SerializerMethodField()
    
    # Check if user owns a store or is an employee to unlock Merchant features
    is_merchant = serializers.SerializerMethodField()
    managed_stores = serializers.SerializerMethodField()
    
    # Historical purchase ledger nodes
    orders = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'name', 'nickname', 'email', 'date_joined', 'experience_level', 
            'total_orders', 'total_invested', 'is_merchant', 'managed_stores', 'orders'
        ] # <--- ADICIONADO 'name' NA TUPLA DE CAMPOS

    def get_total_orders(self, obj):
        return Order.objects.filter(user=obj.user).count()

    def get_total_invested(self, obj):
        from django.db.models import Sum
        total = Order.objects.filter(user=obj.user).aggregate(total=Sum('total_paid'))['total']
        return round(total, 2) if total else 0.00

    def get_is_merchant(self, obj):
        return obj.user.owned_stores.filter(status='APPROVED').exists() or obj.user.store_employments.exists()

    def get_managed_stores(self, obj):
        stores = Store.objects.filter(merchant=obj.user)
        return [{'id': s.id, 'name': s.name, 'slug': s.slug, 'status': s.status} for s in stores]

    def get_orders(self, obj):
        items = OrderItem.objects.filter(order__user=obj.user).select_related('perfume', 'perfume__store').order_by('-order__created_at')
        return ProfileOrderItemSerializer(items, many=True).data
