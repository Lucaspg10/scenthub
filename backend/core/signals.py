# src/core/signals.py
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .models import Perfume, UserProfile, PriceHistory

@receiver(pre_save, sender=Perfume)
def handle_perfume_mutations(sender, instance, **kwargs):
    """
    Validation and Audit Pipeline:
    1. Prevents negative stock (Data Integrity).
    2. Logs price history mutations for future analytics (Audit Trail).
    """
    # 1. Negative Stock Mesh
    if instance.stock_quantity < 0:
        raise ValidationError("O estoque não pode ser negativo.")

    # 2. Price History Audit Trail
    if instance.pk:  # Only update history if the record already exists
        try:
            old_instance = Perfume.objects.get(pk=instance.pk)
            if old_instance.price != instance.price:
                PriceHistory.objects.create(
                    perfume=instance,
                    old_price=old_instance.price,
                    new_price=instance.price
                )
        except Perfume.DoesNotExist:
            # New instance being saved, skip audit log
            pass

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Identity bootstrap: Automatically spawns a UserProfile whenever 
    a new core User account is registered in the system.
    """
    if created:
        UserProfile.objects.create(user=instance)
