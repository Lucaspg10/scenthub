from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """
    Allows the administrator to view and manage items directly inside the Order detail page.
    """
    model = OrderItem
    extra = 0
    # Using raw_id_fields to avoid loading a massive dropdown of perfumes in production
    raw_id_fields = ['perfume']

    # Translating headers for the administrative end-user interface
    verbose_name = "Item do Pedido"
    verbose_name_plural = "Itens do Pedido"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Administrative interface configuration for financial Order records.
    """
    list_display = ['id', 'user', 'total_amount', 'status', 'payment_method', 'transaction_id', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['id', 'transaction_id', 'user__username', 'user__email']
    list_editable = ['status']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]

    # Grouping fields cleanly in the detail form edit view
    fieldsets = (
        ('Informação do Cliente', {
            'fields': ('user',)
        }),
        ('Detalhes Financeiros', {
            'fields': ('total_amount', 'status', 'payment_method')
        }),
        ('Integração com o Gateway', {
            'fields': ('transaction_id', 'failure_reason'),
            'classes': ('collapse',), # Collapses the section to keep the UI clean
        }),
    )
