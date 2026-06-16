# src/core/admin.py
from django.contrib import admin
from .models import (
    UserProfile, Store, StoreEmployee, Category, 
    Perfume, PriceHistory, Review, Cart, CartItem, Order, OrderItem
)

"""
Developer Note: Administrative interface for internal Axis operations.
All models registered to ensure auditability and operational triage capability.
Quiz artifacts removed to match current core model schema.
"""

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'merchant', 'status', 'created_at')
    list_filter = ('status',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'merchant__username')

@admin.register(StoreEmployee)
class StoreEmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'store', 'role', 'created_at')
    list_filter = ('role', 'store')
    search_fields = ('user__username', 'store__name')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Perfume)
class PerfumeAdmin(admin.ModelAdmin):
    list_display = ('name', 'store', 'price', 'stock_quantity', 'is_active', 'is_archived')
    list_filter = ('store', 'is_active', 'is_archived', 'categories')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')

@admin.register(PriceHistory)
class PriceHistoryAdmin(admin.ModelAdmin):
    list_display = ('perfume', 'old_price', 'new_price', 'changed_at')
    list_filter = ('perfume',)
    search_fields = ('perfume__name',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('perfume', 'user', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('perfume__name', 'user__username')

class CartItemInLine(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_key', 'created_at')
    inlines = [CartItemInLine]

class OrderItemInLine(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('historical_price',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_paid', 'axis_commission', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username',)
    inlines = [OrderItemInLine]
    readonly_fields = ('axis_commission', 'total_paid', 'subtotal')
