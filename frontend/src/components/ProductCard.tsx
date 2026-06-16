// src/components/ProductCard.tsx
import { useState } from "react";
import { ShoppingBag, Eye } from "lucide-react";
import { motion } from "framer-motion";

/*
  Developer Note: English type interfaces and comments preserved for repository integrity.
  User Interface: Pure premium Portuguese layout adhering to the Axis luxury guidelines.
  Data Sync: Dynamic Ledger mapping synchronized strictly with Django REST serialization outputs.
*/

export interface Product {
  id: string | number;
  brand?: string;
  name: string;
  price: string | number; // Aceita tanto o string do PostgreSQL quanto número mapeado
  priceNum?: number;
  image?: string;
  image_url?: string;     // Fio direto com o serializer do Django
  scentNotes?: { top: string[]; heart: string[]; base: string[] };
  top_notes?: string;     // String bruta do Django
  heart_notes?: string;   // String bruta do Django
  base_notes?: string;    // String bruta do Django
  family?: string;
  concentration?: string;
  shopId?: string | number; 
  shopName?: string; 
  store_name?: string;    // Mapeamento direto do nome da loja caso o DRF mande assim
  rating?: number | string;
  reviewCount?: number;
  review_count?: number;  // Variável do serializer
  description?: string;
  standard_description?: string;
  reviews?: Array<any>;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onOpenDetails }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  // Resolução de Conflitos: Puxa o dado do DRF, senão cai pro Mock limpo (Sem Hardcode Cego)
  const displayImage = product.image_url || product.image || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600";
  const displayBrand = product.brand || "Axis Collection"; // Fallback apenas de marca genérica
  const displayShop = product.store_name || product.shopName || "Ateliê Associado";

  // Formatação de Preço Estrita
  const rawPrice = product.price !== undefined ? product.price : (product.priceNum || 0);
  const formattedPrice = typeof rawPrice === "number"
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rawPrice)
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(rawPrice) || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col cursor-pointer h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenDetails(product)}
    >
      {/* Visual Container with Zoom Inductor */}
      <div
        className="relative overflow-hidden mb-5 bg-[#141210] aspect-[3/4]"
        style={{ borderRadius: "2px" }}
      >
        <motion.img
          src={displayImage}
          alt={`${displayBrand} — ${product.name}`}
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.05 : 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Minimalist Action HUD Inductor */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ backgroundColor: hovered ? "rgba(12, 11, 9, 0.35)" : "transparent" }}
        >
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 backdrop-blur-md shadow-2xl"
            style={{ backgroundColor: "rgba(12, 11, 9, 0.85)", borderRadius: "2px" }}
          >
            <Eye size={14} strokeWidth={2} color="#E5C995" />
            <span 
              className="text-[11px] tracking-[0.15em] uppercase font-semibold"
              style={{ color: "#F2EDE4", fontFamily: "'Jost', sans-serif" }}
            >
              Ver Detalhes
            </span>
          </motion.div>
        </div>
      </div>

      {/* Typography Metadata Block */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p
            className="text-[11px] tracking-[0.15em] uppercase font-semibold"
            style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
          >
            {displayBrand}
          </p>
          <span 
            className="text-[11px] tracking-wide font-medium"
            style={{ fontFamily: "'Jost', sans-serif", color: "#E5C995" }}
          >
            por {displayShop}
          </span>
        </div>

        <h3
          className="mb-2 leading-snug font-medium line-clamp-1"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.1rem",
            color: "#F2EDE4",
          }}
        >
          {product.name}
        </h3>

        <p
          className="mb-4 font-semibold mt-auto"
          style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif", fontSize: "0.95rem" }}
        >
          {formattedPrice}
        </p>

        {/* Inline Add Action */}
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 py-3.5 px-4 text-[12px] tracking-[0.15em] uppercase w-full transition-all duration-300 font-semibold"
          style={{
            border: "1px solid",
            borderColor: added ? "#E5C995" : "rgba(242, 237, 228, 0.15)",
            color: added ? "#0C0B09" : "#F2EDE4",
            backgroundColor: added ? "#E5C995" : "transparent",
            fontFamily: "'Jost', sans-serif",
            borderRadius: "2px",
          }}
          onMouseEnter={(e) => {
            if (!added) {
              e.currentTarget.style.borderColor = "#E5C995";
              e.currentTarget.style.backgroundColor = "rgba(229, 201, 149, 0.04)";
            }
          }}
          onMouseLeave={(e) => {
            if (!added) {
              e.currentTarget.style.borderColor = "rgba(242, 237, 228, 0.15)";
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <ShoppingBag size={14} strokeWidth={2} />
          {added ? "Adicionado!" : "Adicionar"}
        </button>
      </div>
    </motion.div>
  );
}