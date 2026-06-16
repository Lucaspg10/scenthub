# src/core/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

"""
Developer Note: English type interfaces and comments preserved for repository integrity.
User Interface / Status Displays: Pure premium Portuguese layouts adhering to Axis brand guidelines.
System Integrity: Implemented Soft-Delete / Archival logic on Perfume model.
"""

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    def __str__(self):
        return f"Perfil de {self.user.username}"


class Store(models.Model):
    """
    Represents a merchant store inside the Your Essence platform.
    Features state compliance tracking for multi-step onboarding and audit verification freeze.
    """
    STATUS_CHOICES = [
        ('SANDBOX', 'Em Configuração / Rascunho (Inativa)'),
        ('PENDING', 'Aguardando Aprovação / Triagem'),
        ('APPROVED', 'Aprovada / Ativa no Catálogo'),
        ('SUSPENDED', 'Suspensa / Sob Análise de Fraude ou Restrição'),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_stores")
    
    # Target compliance data fields for criminal/credit history checks
    cnpj = models.CharField(max_length=18, blank=True, null=True, unique=True)
    cpf = models.CharField(max_length=14, blank=True, null=True, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Operational flags for onboarding triage management
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='SANDBOX')
    triaged_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True, help_text="Motivo detalhado do veto de segurança.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Loja"
        verbose_name_plural = "Lojas"

    def __str__(self):
        return f"{self.name} [{self.get_status_display()}]"


class StoreEmployee(models.Model):
    """
    Maps platform users to default RBAC roles inside a target store micro-universe.
    Provides standard out-of-the-box permission sets without merchant configuration overload.
    """
    ROLE_CHOICES = [
        ('MANAGER', 'Gerente da Loja'),
        ('STAFF', 'Cadastrador / Estoquista'),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="employees")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="store_employments")
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='STAFF')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Funcionário da Loja"
        verbose_name_plural = "Funcionários das Lojas"
        unique_together = ('store', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} em ({self.store.name})"


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"

    def __str__(self):
        return self.name


class Perfume(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="perfumes")
    categories = models.ManyToManyField(Category, related_name="perfumes")
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(max_length=500)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, help_text="Visível na vitrine.")
    is_archived = models.BooleanField(default=False, help_text="Lojista inativou o produto.")

    # Apenas a descrição padrão importa agora
    description = models.TextField(help_text="Descrição comercial padrão do perfume.")

    top_notes = models.CharField(max_length=500, blank=True, help_text="Notas de saída separadas por vírgula.")
    heart_notes = models.CharField(max_length=500, blank=True, help_text="Notas de corpo separadas por vírgula.")
    base_notes = models.CharField(max_length=500, blank=True, help_text="Notas de fundo separadas por vírgula.")

    class Meta:
        verbose_name = "Perfume"
        verbose_name_plural = "Perfumes"

    def delete(self, *args, **kwargs):
        if self.order_items.exists():
            self.is_active = False
            self.is_archived = True
            self.save()
        else:
            super().delete(*args, **kwargs)

    def __str__(self):
        return f"[{self.store.name}] {self.name}"


class PriceHistory(models.Model):
    """
    Audit log architecture mapping every physical price alteration over time for platform analytics.
    """
    perfume = models.ForeignKey(Perfume, on_delete=models.CASCADE, related_name='price_logs')
    old_price = models.DecimalField(max_digits=10, decimal_places=2)
    new_price = models.DecimalField(max_digits=10, decimal_places=2)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Histórico de Preço"
        verbose_name_plural = "Históricos de Preços"
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.perfume.name}: R$ {self.old_price} → R$ {self.new_price}"


class Review(models.Model):
    """
    Organic client feedback logs mapped directly across distinct database profiles.
    """
    perfume = models.ForeignKey(Perfume, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Avaliação"
        verbose_name_plural = "Avaliações"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating} Estrelas — {self.user.username} em ({self.perfume.name})"


class Cart(models.Model):
    """
    Handles guest and authenticated user baskets.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="carts")
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return f"Carrinho de: {self.user.username}"
        return f"Carrinho Anônimo (Sessão: {self.session_key})"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    perfume = models.ForeignKey(Perfume, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.perfume.name}"


class Order(models.Model):
    """
    Immutable legal transaction ledger log. 
    Tracks customer investments and automatically applies the 5% platform take rate.
    """
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="core_orders")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    axis_commission = models.DecimalField(max_digits=10, decimal_places=2, help_text="Taxa fixa de intermediação de 5%.")
    total_paid = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido #{self.id} — Cliente: {self.user.username}"


class OrderItem(models.Model):
    """
    Historical item lookup preventing past price modifications from corrupting transaction reports.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    perfume = models.ForeignKey(Perfume, on_delete=models.PROTECT, related_name="core_order_items")
    historical_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço do item fixado no momento do checkout.")
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.perfume.name} no Pedido #{self.order.id}"
