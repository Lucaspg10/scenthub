// src/components/SearchModal.tsx
import { useState, useMemo } from "react";
import { X, Search, SlidersHorizontal, Tag, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard, type Product } from "./ProductCard";

/*
  Developer Note: English transition pipelines and layout tokens preserved.
  User Interface: Implemented high-contrast Portuguese marketplace wireframe.
  Layout Matrix: Left sticky column feeds filter criteria to the main responsive fluid product grid.
*/

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

const FAMILIES = ["Todos", "Amadeirado", "Floral Oriental", "Aquático", "Oriental", "Cítrico"];
const PRICE_RANGES = [
  { label: "Todos os Preços", min: 0, max: Infinity },
  { label: "Até R$ 200", min: 0, max: 200 },
  { label: "R$ 200 a R$ 350", min: 200, max: 350 },
  { label: "Acima de R$ 350", min: 350, max: Infinity },
];

export function SearchModal({ isOpen, onClose, products = [], onAddToCart, onOpenDetails }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("Todos");
  const [selectedPrice, setSelectedPrice] = useState(0);

  // Pipeline computacional de filtros combinados
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(query.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(query.toLowerCase()));

      const matchesFamily = selectedFamily === "Todos" || product.family === selectedFamily;

      const price = product.priceNum || 0;
      const range = PRICE_RANGES[selectedPrice];
      const matchesPrice = price >= range.min && price <= range.max;

      return matchesQuery && matchesFamily && matchesPrice;
    });
  }, [products, query, selectedFamily, selectedPrice]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0C0B09] flex flex-col overflow-hidden animate-fade-in">
      
      {/* Top Navigation HUD da Loja */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#11100E] px-6 md:px-12 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-4 flex-1 max-w-2xl relative">
          <Search size={20} className="text-[#E5C995] absolute left-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar no catálogo Axis..."
            className="w-full bg-[#0C0B09] text-[#F2EDE4] placeholder-[#A39683]/40 outline-none text-md tracking-wide pl-11 pr-4 py-2.5 border border-white/5 focus:border-[#E5C995]/30 transition-colors"
            style={{ fontFamily: "'Jost', sans-serif", borderRadius: "2px" }}
          />
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[#A39683] hover:text-[#F2EDE4] transition-colors uppercase tracking-[0.2em] text-[11px] font-bold"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          <span>Fechar Catálogo</span>
          <X size={18} />
        </button>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Control Sidebar Panel (Filtros Laterais) */}
        <aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-[#11100E]/40 overflow-y-auto p-8 space-y-8 flex-shrink-0">
          
          <div className="flex items-center gap-2 text-[#F2EDE4] text-[12px] uppercase tracking-widest font-bold border-b border-white/5 pb-3">
            <SlidersHorizontal size={14} className="text-[#E5C995]" />
            <span>Filtros Avançados</span>
          </div>

          {/* Categoria Olfativa */}
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-wider text-[#A39683] font-bold flex items-center gap-2">
              <Tag size={12} className="text-[#E5C995]" />
              Família Olfativa
            </label>
            <div className="flex flex-col gap-1.5">
              {FAMILIES.map((family) => (
                <button
                  key={family}
                  onClick={() => setSelectedFamily(family)}
                  className="text-left text-sm py-1.5 px-3 transition-colors duration-200"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    color: selectedFamily === family ? "#E5C995" : "#A39683",
                    backgroundColor: selectedFamily === family ? "rgba(229, 201, 149, 0.03)" : "transparent",
                    borderLeft: selectedFamily === family ? "2px solid #E5C995" : "2px solid transparent"
                  }}
                >
                  {family}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa de Preços */}
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-wider text-[#A39683] font-bold flex items-center gap-2">
              <DollarSign size={12} className="text-[#E5C995]" />
              Preço
            </label>
            <div className="flex flex-col gap-1.5">
              {PRICE_RANGES.map((range, index) => (
                <button
                  key={range.label}
                  onClick={() => setSelectedPrice(index)}
                  className="text-left text-sm py-1.5 px-3 transition-colors duration-200"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    color: selectedPrice === index ? "#E5C995" : "#A39683",
                    backgroundColor: selectedPrice === index ? "rgba(229, 201, 149, 0.03)" : "transparent",
                    borderLeft: selectedPrice === index ? "2px solid #E5C995" : "2px solid transparent"
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Right Fluid Viewport Container (O Grid dos Perfumes) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          
          {/* Metadata Display */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs text-[#A39683] uppercase tracking-widest font-semibold" style={{ fontFamily: "'Jost', sans-serif" }}>
              Exibindo {filteredProducts.length} de {products.length} criações
            </p>
          </div>

          {/* Responsive Square Grid Layout */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.28 }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      onOpenDetails={(p) => {
                        onOpenDetails(p);
                        onClose(); // Auto close catalog on detail view call
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-white/5 bg-[#11100E]/10 rounded-[2px]">
              <p className="text-sm text-[#A39683]" style={{ fontFamily: "'Jost', sans-serif" }}>
                Nenhuma fragrância corresponde aos filtros aplicados.
              </p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}