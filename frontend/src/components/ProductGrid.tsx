// src/components/ProductGrid.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductCard, type Product } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";
import { api } from "../services/api";

/*
  Developer Note: English logs and architectural types preserved.
  User Interface: Completely designed in Portuguese following the Axis luxury theme.
  Data Pipeline: Linked rating and reviewCount metadata fetched straight from Django serialization models.
  Bugfix: Stopped formatting currency strings prematurely inside the mapping sequence to prevent downstream parsing failures.
*/

interface BackendPerfume {
  id: number;
  name: string;
  price: string;
  image_url: string;
  stock_quantity: number;
  standard_description: string;
  description: string;
  is_active: boolean;
  store_name?: string;
  family?: string;
  concentration?: string;
  rating?: number | string;
  review_count?: number | string;
  top_notes?: string;
  heart_notes?: string;
  base_notes?: string;
  reviews?: Array<any>;
}

const FAMILIES = ["Todos", "Amadeirado", "Floral Oriental", "Aquático", "Oriental"];

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);
  const [activeFamily, setActiveFamily] = useState("Todos");

  // Multi-tenant modal staging hooks
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDatabaseProducts() {
      try {
        setLoading(true);
        const response = await api.get<BackendPerfume[]>("perfumes/");
        
        const mappedProducts: Product[] = response.data
          .filter((perfume) => perfume.is_active)
          .map((perfume) => ({
            id: String(perfume.id),
            brand: "Axis Exclusive",
            name: perfume.name,
            
            // CORREÇÃO: Passa a string numérica pura ("189.90") para que o Card e o Modal formatem sem quebrar
            price: perfume.price, 
            priceNum: parseFloat(perfume.price),
            
            image: perfume.image_url || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600",
            
            // CONEXÃO DIRETA COM O BANCO DE DADOS (Chega de Hardcode)
            top_notes: perfume.top_notes,
            heart_notes: perfume.heart_notes,
            base_notes: perfume.base_notes,
            
            scentNotes: { 
              top: perfume.top_notes ? [perfume.top_notes] : ["Geral"], 
              heart: perfume.heart_notes ? [perfume.heart_notes] : ["Geral"], 
              base: perfume.base_notes ? [perfume.base_notes] : ["Geral"] 
            }, 
            family: perfume.family || "Amadeirado", 
            concentration: perfume.concentration || "EDP",
            shopId: "database_shop",
            shopName: perfume.store_name || "Ateliê Associado",
            store_name: perfume.store_name,
            
            description: perfume.description || perfume.standard_description,
            standard_description: perfume.standard_description,
            
            // PASSANDO OS REVIEWS E AGREGADOS BRUTOS DA API
            reviews: perfume.reviews || [],
            rating: perfume.rating !== undefined && perfume.rating !== null ? +(perfume.rating) : 0,
            review_count: perfume.review_count !== undefined && perfume.review_count !== null ? +(perfume.review_count) : 0,
            reviewCount: perfume.review_count !== undefined && perfume.review_count !== null ? +(perfume.review_count) : 0
          }));

        setProducts(mappedProducts);
      } catch (err: any) {
        setError("Não foi possível carregar as fragrâncias do servidor.");
      } finally {
        setLoading(false);
      }
    }

    fetchDatabaseProducts();
  }, []);

  const baseFilteredProducts = products.filter((product) => {
    if (activeFamily === "Todos") return true;
    return product.family === activeFamily;
  });

  const displayedProducts = showAll 
    ? baseFilteredProducts 
    : baseFilteredProducts.slice(0, 3);

  const handleOpenDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <span className="text-xs tracking-[0.3em] uppercase text-[#E5C995] animate-pulse font-semibold">
          Carregando Acervo...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-32">
        <p className="text-sm tracking-widest text-red-400 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <section className="py-24 md:py-32 border-t border-white/5" id="fragrancias" style={{ backgroundColor: "#0C0B09" }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div>
            <p className="text-[12px] tracking-[0.25em] uppercase mb-4 flex items-center gap-2 font-semibold" style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}>
              <Sparkles size={13} />
              {showAll ? "Catálogo Geral de Fragrâncias" : "Seleção de Alta Perfumaria"}
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "clamp(2.2rem, 3.5vw, 3rem)", color: "#F2EDE4", lineHeight: 1.1 }}>
              {showAll ? "Explore o Acervo" : "Criações em Destaque"}
            </h2>
          </div>
          <p className="max-w-md leading-relaxed font-normal text-[15px]" style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}>
            {showAll 
              ? "Navegue pela coleção descentralizada completa criada de forma independente pelos nossos ateliês parceiros."
              : "Fragrâncias exclusivas selecionadas e em evidência nesta semana pelos mestres perfumistas da rede."}
          </p>
        </div>

        <AnimatePresence>
          {showAll && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} className="flex flex-wrap gap-3 mb-12 border-b border-white/5 pb-6">
              {FAMILIES.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFamily(f)}
                  className="px-5 py-2.5 text-[12px] tracking-[0.15em] uppercase transition-all duration-300 font-semibold"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    border: "1px solid",
                    borderRadius: "2px",
                    borderColor: activeFamily === f ? "#E5C995" : "rgba(242, 237, 228, 0.15)",
                    color: activeFamily === f ? "#E5C995" : "#A39683",
                    backgroundColor: activeFamily === f ? "rgba(229, 201, 149, 0.05)" : "transparent",
                  }}
                >
                  {f}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14">
          <AnimatePresence mode="popLayout">
            {displayedProducts.map((product, idx) => (
              <motion.div key={product.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: idx * 0.03 }}>
                <ProductCard product={product} onAddToCart={onAddToCart} onOpenDetails={handleOpenDetails} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!showAll && baseFilteredProducts.length > 3 && (
          <div className="flex justify-center mt-20">
            <button
              onClick={() => {
                setShowAll(true);
                setTimeout(() => {
                  document.getElementById("fragrancias")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="group flex items-center gap-3 px-8 py-4 text-[12px] tracking-[0.2em] uppercase transition-all duration-300 hover:gap-5 font-semibold"
              style={{ border: "1px solid #E5C995", color: "#E5C995", fontFamily: "'Jost', sans-serif", borderRadius: "2px", backgroundColor: "rgba(229, 201, 149, 0.02)" }}
            >
              Ver Todas as Opções
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>

      <ProductDetailModal 
        isOpen={isDetailsOpen}
        product={selectedProduct}
        onClose={() => setIsDetailsOpen(false)}
        onAddToCart={onAddToCart}
      />
    </section>
  );
}