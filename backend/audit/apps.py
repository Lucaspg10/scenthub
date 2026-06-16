from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'
    verbose_name = 'Auditoria do Sistema'

    def ready(self):
        """
        Imports the audit signals pipeline during application registry configuration.
        """
        import audit.signals
