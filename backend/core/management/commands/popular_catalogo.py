# core/management/commands/popular_catalogo.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils.text import slugify
from core.models import Store, Category, Perfume, Review

"""
Developer Note: Automated data ingestion script for catalog setup.
System operations, logs, and class structures are documented in English.
User Interface / Output Messages: Kept entirely in Portuguese.
Verification: Injects real olfactory matrix text and organic review testing ledgers.
"""

class Command(BaseCommand):
    help = "Populates the database with initial standard store, categories, perfumes, and testing reviews."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Iniciando a população do catálogo Axis..."))

        # 1. Guarantee a Master Administrator/Merchant exists to own the store
        admin_user, created = User.objects.get_or_create(
            username="admin_your_essence",
            defaults={"is_staff": True, "is_superuser": True}
        )
        if created:
            admin_user.set_password("SenhaMestre123!")
            admin_user.save()

        # Create dummy buyer accounts for organic review simulation
        buyer_lucas, _ = User.objects.get_or_create(username="lucas_pereira", defaults={"email": "lucas@axis.com"})
        buyer_mariana, _ = User.objects.get_or_create(username="mariana_costa", defaults={"email": "mariana@axis.com"})

        # 2. Spawn the Core Marketplace Store in APPROVED status
        store, _ = Store.objects.get_or_create(
            slug="your-essence-prime",
            defaults={
                "name": "Your Essence Prime",
                "description": "Loja principal de fragrâncias e contratipos premium.",
                "merchant": admin_user,
                "status": "APPROVED"
            }
        )

        # 3. Create Categories (limpo, sem ui_target)
        cat_data = [
            {"name": "Frescor do Dia", "slug": "frescor-do-dia"},
            {"name": "Encontro Romântico", "slug": "encontro-romantico"},
            {"name": "Floral Amadeirado", "slug": "floral-amadeirado"},
            {"name": "Oriental Especiado", "slug": "oriental-especiado"},
            {"name": "Uso Geral", "slug": "uso-geral"},
        ]

        categories_dict = {}
        for cat in cat_data:
            category, _ = Category.objects.get_or_create(
                slug=cat["slug"],
                defaults={"name": cat["name"]}
            )
            categories_dict[cat["slug"]] = category

        # 4. Core Perfumes Catalog Dataset (Atualizado para o novo modelo)
        perfumes_dataset = [
            {
                "name": "Essence Sauvage",
                "price": 189.90,
                "stock_quantity": 45,
                "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601",
                "description": "Fragrância masculina marcante com notas de bergamota da calábria e ambroxan.",
                "top_notes": "Bergamota da Calábria, Pimenta de Szechuan",
                "heart_notes": "Luz de Lavanda, Pimenta Rosa, Elemi",
                "base_notes": "Ambroxan, Cedro Nobre, Labdanum",
                "cats": ["frescor-do-dia", "uso-geral"],
                "reviews": [
                    {"user": buyer_lucas, "rating": 5, "comment": "Projeção limpa de Ambroxan. Acabamento de altíssimo nível para o dia a dia."},
                    {"user": buyer_mariana, "rating": 4, "comment": "Saída cítrica muito pungente. Na minha pele fixou por cerca de 8h tranquilamente."}
                ]
            },
            {
                "name": "Nuit Seduction",
                "price": 210.00,
                "stock_quantity": 30,
                "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f",
                "description": "Fragrância intensa e misteriosa com acordes doces de baunilha e especiarias de fundo.",
                "top_notes": "Cardamomo, Especiarias Frias",
                "heart_notes": "Lavanda Absoluta, Íris da Toscana",
                "base_notes": "Baunilha Preta, Cumaru, Couro Russo",
                "cats": ["encontro-romantico", "oriental-especiado"],
                "reviews": [
                    {"user": buyer_lucas, "rating": 5, "comment": "Perfume absurdamente sedutor. Baunilha densa sem ser enjoativa."},
                ]
            },
            {
                "name": "Bleu Absolute",
                "price": 195.50,
                "stock_quantity": 25,
                "image_url": "https://images.unsplash.com/photo-1523293182086-7651a899d37f",
                "description": "Um tributo à liberdade masculina em uma fragrância amadeirada aromática de rastro cativante.",
                "top_notes": "Toranja da Calábria, Hortelã Fresca, Pimenta Rosa",
                "heart_notes": "Noz-moscada, Gengibre de Madagascar, Jasmim Hidropônico",
                "base_notes": "Incenso Incandescente, Cedro Seco, Sândalo, Patchouli",
                "cats": ["uso-geral", "floral-amadeirado"],
                "reviews": [
                    {"user": buyer_mariana, "rating": 5, "comment": "Extremamente versátil, elegante e elogiado. Uma joia amadeirada."}
                ]
            }
        ]

        # 5. Commit items to database and attach relationships
        for p_info in perfumes_dataset:
            perfume, created = Perfume.objects.get_or_create(
                slug=slugify(p_info["name"]),
                defaults={
                    "store": store,
                    "name": p_info["name"],
                    "price": p_info["price"],
                    "stock_quantity": p_info["stock_quantity"],
                    "image_url": p_info["image_url"],
                    "description": p_info["description"],
                    "top_notes": p_info["top_notes"],
                    "heart_notes": p_info["heart_notes"],
                    "base_notes": p_info["base_notes"],
                    "is_active": True
                }
            )
            
            # Se o registro já existia, atualiza os dados
            if not created:
                perfume.description = p_info["description"]
                perfume.top_notes = p_info["top_notes"]
                perfume.heart_notes = p_info["heart_notes"]
                perfume.base_notes = p_info["base_notes"]
                perfume.price = p_info["price"]
                perfume.image_url = p_info["image_url"]
                perfume.save()

            # Link relationship between perfume and its categories safely
            for cat_slug in p_info["cats"]:
                perfume.categories.add(categories_dict[cat_slug])
            
            # Injetar avaliações falsas
            for r_info in p_info["reviews"]:
                Review.objects.get_or_create(
                    perfume=perfume,
                    user=r_info["user"],
                    defaults={
                        "rating": r_info["rating"],
                        "comment": r_info["comment"]
                    }
                )

            perfume.save()

        self.stdout.write(self.style.SUCCESS("Banco de dados populado, notas preenchidas e reviews sincronizadas com sucesso!"))
