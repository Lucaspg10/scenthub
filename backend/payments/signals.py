from django.db import transaction
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from .models import Order


@receiver(pre_save, sender=Order)
def process_inventory_on_payments(sender, instance, **kwargs):
    """
    Listens to Order state transitions via pre_save. When an order shifts to 'PAID',
    it safely decrements stock levels inside the core app, preventing negative levels.
    """
    # Check if this is an update to an existing order, not a new creation
    if instance.pk:
        # Fetch the exact state currently saved in the database before the memory overwrite
        previous_state = Order.objects.get(pk=instance.pk)
        
        # Trigger inventory updates ONLY when shifting from any other status to 'PAID'
        if previous_state.status != 'PAID' and instance.status == 'PAID':
            
            # Open an atomic database transaction block to secure row-level locking
            with transaction.atomic():
                # We iterate through items but safely fetch and LOCK each perfume row individually
                for item in instance.items.all():
                    # Importing inside the signal context to prevent any app registry circular bugs
                    from backend.core.models import Perfume
                    
                    # select_for_update locks the row until the end of this atomic block
                    perfume = Perfume.objects.select_for_update().get(pk=item.perfume_id)
                    
                    # Critical business check to prevent negative inventory levels
                    if perfume.stock_quantity < item.quantity:
                        raise ValidationError(
                            f"Estoque insuficiente para o perfume '{perfume.name}'. "
                            f"Disponível: {perfume.stock_quantity}, Solicitado: {item.quantity}."
                        )
                    
                    # Atomically decrement the inventory levels safely before the order changes state
                    perfume.stock_quantity -= item.quantity
                    perfume.save(update_fields=['stock_quantity'])
