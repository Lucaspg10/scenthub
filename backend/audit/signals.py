import json
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from core.models import Perfume
from payments.models import Order
from .models import AuditLog


@receiver(post_save, sender=Perfume)
def audit_perfume_save(sender, instance, created, **kwargs):
    """
    Listens to Perfume mutations to log modifications on price or stock levels.
    """
    action = 'CREATE' if created else 'UPDATE'

    # Building a snapshot of critical data fields
    payload = {
        "name": instance.name,
        "price": str(instance.price),
        "stock_quantity": instance.stock_quantity,
        "is_active": instance.is_active
    }

    # Writes down the state modification into the black box
    AuditLog.objects.create(
        user=None,  # Set to None for system/automated background tasks
        app_label='core',
        model_name='perfume',
        object_id=instance.id,
        action=action,
        changes_payload=payload
    )


@receiver(post_save, sender=Order)
def audit_order_save(sender, instance, created, **kwargs):
    """
    Listens to Order state modifications to trace transaction lifecycle compliance.
    """
    if not created:  # We focus primarily on state transitions (e.g., PENDING -> PAID)
        payload = {
            "status": instance.status,
            "total_amount": str(instance.total_amount),
            "payment_method": instance.payment_method,
            "transaction_id": instance.transaction_id
        }

        AuditLog.objects.create(
            user=instance.user,
            app_label='payments',
            model_name='order',
            object_id=instance.id,
            action='UPDATE',
            changes_payload=payload
        )


@receiver(post_delete, sender=Perfume)
def audit_perfume_delete(sender, instance, **kwargs):
    """
    Logs catastrophic product deletions from the store catalog.
    """
    payload = {
        "name": instance.name,
        "price": str(instance.price),
        "notice": "Registro deletado permanentemente do banco de dados."
    }

    AuditLog.objects.create(
        user=None,
        app_label='core',
        model_name='perfume',
        object_id=instance.id,
        action='DELETE',
        changes_payload=payload
    )
