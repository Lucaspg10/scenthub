// src/components/ProductDetailModal.tsx
import { X, ShoppingBag, Star, MessageSquare, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Product } from "./ProductCard";

/*
  Developer Note: Architectural state maps and motion properties managed in English.
  User Interface: Localized 1:1 in Portuguese matching the core Axis typography specifications.
  Design Refactor: Heightened compact vertical threshold to h-[360px] to snap olfactory grid exactly beneath the uncropped image bounds.
  Data Layer Isolation: Removed all static hardcoded anchors (4.9, 5.0, 24). Strictly consuming dynamic outputs from Django REST.
*/

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetailModal({ isOpen, product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null;

  // Direct reference to the raw JSON serialized data stream from Django
  const p = product as any;

  const renderNotes = (noteField: string | string[] | undefined, fallback: string) => {
    if (!noteField) return fallback;
    if (Array.isArray(noteField)) return noteField.join(", ");
    return noteField;
  };

  const safeNotes = {
    top: p.top_notes || p.scentNotes?.top || "",
    heart: p.heart_notes || p.scentNotes?.heart || "",
    base: p.base_notes || p.scentNotes?.base || ""
  };

  const activeReviews = p.reviews || [];

  // Data Integrity Isolation: Strictly digests Django DRF Decimal field strings into float mappings
  const rawPrice = p.price !== undefined ? p.price : (p.priceNum || 0);
  const numPrice = typeof rawPrice === "number" ? rawPrice : parseFloat(rawPrice) || 0;
  
  const formattedPrice = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(numPrice);

  // Synchronized bindings tracking live database aggregate functions directly from PerfumeSerializer
  const systemRating = p.rating !== undefined ? (typeof p.rating === "string" ? parseFloat(p.rating) : p.rating) : 0.0;
  const systemReviewCount = p.review_count !== undefined ? parseInt(p.review_count, 10) || 0 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(12, 11, 9, 0.96)" }}
            onClick={onClose}
          />

          {/* Modal Master Frame Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-w-5xl max-h-[90vh] border border-white/15 shadow-2xl overflow-y-auto"
              style={{ backgroundColor: "#0C0B09", borderRadius: "4px" }}
            >
              <style>{`div::-webkit-scrollbar { width: 4px; } div::-webkit-scrollbar-thumb { background: #E5C995; }`}</style>

              {/* Close HUD Window Trigger */}
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-[#A39683] hover:text-[#F2EDE4] transition-colors p-2 z-10 bg-[#0C0B09]/80 backdrop-blur-md border border-white/15"
                style={{ borderRadius: "2px" }}
              >
                <X size={20} strokeWidth={2} />
              </button>

              {/* Balanced 6:6 Double Column Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                
                {/* LEFT SIDE COLUMN (6/12): Product Image and Sub-Nested Olfactory Pyramid */}
                <div className="md:col-span-6 p-8 md:p-10 flex flex-col bg-[#11100E]/20">
                  
                  {/* Calibrated Image Box */}
                  <div className="w-full flex items-center justify-center mb-6 h-[360px] relative">
                    <img
                      src={p.image_url || p.image || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600"}
                      alt={p.name}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    <div className="absolute top-0 left-0 px-3 py-1.5 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.25em] text-[#E5C995] uppercase font-bold" style={{ backgroundColor: "rgba(12, 11, 9, 0.85)" }}>
                      {p.concentration || "EDP"}
                    </div>
                  </div>

                  {/* Minimalist Olfactory Table Node Component */}
                  <div className="space-y-3">
                    <p className="text-[13px] tracking-[0.2em] uppercase text-[#E5C995] font-bold">
                      Composição Olfativa
                    </p>
                    
                    <div className="w-full border border-white/15 bg-[#0A0908]" style={{ borderRadius: "2px" }}>
                      
                      {/* Top Notes Row */}
                      <div className="grid grid-cols-12 border-b border-white/15 items-center">
                        <div className="col-span-3 px-4 py-3.5 text-[11px] tracking-widest uppercase font-bold text-[#E5C995]/80 border-r border-white/15 bg-[#11100E]/30 h-full flex items-center">
                          Topo
                        </div>
                        <div className="col-span-9 px-5 py-3.5 text-[15px] text-[#F2EDE4] font-normal leading-relaxed">
                          {renderNotes(safeNotes.top, "Não especificado no catálogo")}
                        </div>
                      </div>

                      {/* Heart Notes Row */}
                      <div className="grid grid-cols-12 border-b border-white/15 items-center">
                        <div className="col-span-3 px-4 py-3.5 text-[11px] tracking-widest uppercase font-bold text-[#E5C995]/80 border-r border-white/15 bg-[#11100E]/30 h-full flex items-center">
                          Coração
                        </div>
                        <div className="col-span-9 px-5 py-3.5 text-[15px] text-[#F2EDE4] font-normal leading-relaxed">
                          {renderNotes(safeNotes.heart, "Não especificado no catálogo")}
                        </div>
                      </div>

                      {/* Base Notes Row */}
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-3 px-4 py-3.5 text-[11px] tracking-widest uppercase font-bold text-[#E5C995]/80 border-r border-white/15 bg-[#11100E]/30 h-full flex items-center">
                          Fundo
                        </div>
                        <div className="col-span-9 px-5 py-3.5 text-[15px] text-[#F2EDE4] font-normal leading-relaxed">
                          {renderNotes(safeNotes.base, "Não especificado no catálogo")}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* RIGHT SIDE COLUMN (6/12): Title, Core Pricing, Description & User Comments */}
                <div className="md:col-span-6 p-8 md:p-12 lg:p-14 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/15">
                  <div>
                    {/* Interactive Corporate Multi-tenant Trigger Anchor */}
                    <div 
                      className="inline-block text-[15px] tracking-[0.2em] uppercase font-bold mb-4 cursor-pointer transition-colors text-[#A39683] hover:text-[#E5C995]"
                      onClick={() => alert(`Navegando para o espaço do ${p.store_name || p.shopName || 'Ateliê'}`)}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {p.store_name || p.shopName || "Ateliê Associado"}
                    </div>

                    {/* Highly Defined Luxury Headers */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl mb-5 font-medium leading-[1.15]" style={{ fontFamily: "'Playfair Display', serif", color: "#F2EDE4", letterSpacing: "-0.01em" }}>
                      {p.name}
                    </h2> 

                    <div className="flex items-center gap-5 mb-6">
                      <p className="text-[26px] font-bold text-[#E5C995]" style={{ fontFamily: "'Jost', sans-serif" }}>
                        {formattedPrice}
                      </p>
                      <div className="flex items-center gap-1.5 text-[#E5C995] border-l border-white/15 pl-5">
                        <Star size={16} fill="currentColor" className="text-amber-400" />
                        <span className="text-[16px] font-bold text-[#F2EDE4]">
                          {systemRating.toFixed(1)}
                        </span>
                        <span className="text-[13px] text-[#A39683] font-medium">
                          ({systemReviewCount} {systemReviewCount === 1 ? 'avaliação' : 'avaliações'})
                        </span>
                      </div>
                    </div>

                    {/* Main Description Copy */}
                    <p className="text-[16px] text-[#F2EDE4]/80 font-light leading-relaxed mb-8" style={{ fontFamily: "'Jost', sans-serif" }}>
                      {p.description || p.standard_description || "Fragrância autoral sem descrição cadastrada na rede Axis."}
                    </p>

                    {/* Enhanced Reviews Feed Panel with Max Contrast */}
                    <div className="mt-8 pt-6 border-t border-white/15">
                      <p className="text-[12px] tracking-[0.15em] uppercase text-[#E5C995] font-bold mb-4 flex items-center gap-2">
                        <MessageSquare size={14} /> Feedback dos Apreciadores
                      </p>
                      
                      <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2">
                        {activeReviews.length > 0 ? (
                          activeReviews.map((rev: any, index: number) => (
                            <div key={rev.id || index} className="border-b border-white/15 pb-3.5 last:border-0">
                              <div className="flex justify-between text-[14px] mb-1">
                                <span className="font-semibold text-[#F2EDE4]">{rev.username || rev.user || "Apreciador"}</span>
                                <span className="text-[#A39683] text-[12px] font-medium">
                                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString('pt-BR') : "Recente"}
                                </span>
                              </div>
                              <p className="text-[14px] text-[#D1C9BC] font-normal leading-relaxed">{rev.comment || rev.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[14px] text-[#A39683] font-light italic">Nenhum feedback registrado para esta fragrância ainda.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Purchase CTA System Footer */}
                  <div className="pt-8 border-t border-white/15 mt-8 flex flex-col gap-4">
                    <button
                      onClick={() => onAddToCart(product)}
                      className="w-full py-4.5 text-[13px] tracking-[0.2em] uppercase transition-all duration-300 font-bold flex items-center justify-center gap-3 shadow-lg"
                      style={{ backgroundColor: "#F2EDE4", color: "#0C0B09", fontFamily: "'Jost', sans-serif", borderRadius: "2px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E5C995"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F2EDE4"; }}
                    >
                      <ShoppingBag size={16} strokeWidth={2.5} />
                      Adicionar ao Carrinho
                    </button>
                    
                    <div className="text-[11px] text-[#A39683] uppercase tracking-widest font-semibold flex items-center justify-center gap-2 mt-2">
                      <ShieldCheck size={14} color="#E5C995" /> Procedência Verificada e Homologada pela Axis
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}