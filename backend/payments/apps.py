from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'payments'
    verbose_name = 'Gestão de Pagamentos' # Display name in admin panel

    def ready(self):
        # Imports the signals pipeline implicitly during registry initialization
        import payments.signals
