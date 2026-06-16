// src/components/Cart.tsx
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "./ProductCard";

/*
  Developer Note: Multi-tenant basket synchronization tracking.
  Comments for core data pipelines remain in English for corporate compliance.
  User Interface / Layout Elements: Formatted entirely in Portuguese.
  UX Overhaul: Expanded sidebar drawer, upscaled low-contrast typography to crisp luxury definitions.
  Type Fix: Widened ID parameter maps to support both string and numeric database keys (string | number).
*/

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string | number, delta: number) => void; // Corrigido para string | number
  onRemove: (productId: string | number) => void; // Corrigido para string | number
  onCheckout: () => void;
}

export function Cart({ isOpen, items = [], onClose, onUpdateQty, onRemove, onCheckout }: CartProps) {
  
  // Safe computational layer enforcing fallback metrics to prevent NaN failures during type mutations
  const total = (items || []).reduce((sum, item) => {
    const basePrice = item?.product?.priceNum || 0;
    const quantity = item?.qty || 0;
    return sum + (basePrice * quantity);
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(12, 11, 9, 0.82)" }}
            onClick={onClose}
          />

          {/* Drawer Side-Panel Shell */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] flex flex-col border-l border-white/5"
            style={{ backgroundColor: "#0C0B09" }}
          >
            {/* Header Area */}
            <div className="flex items-center justify-between px-8 py-7 border-b border-white/5 bg-[#11100E]/30">
              <div>
                <h2
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.6rem", color: "#F2EDE4" }}
                >
                  Seu Carrinho
                </h2>
                {items.length > 0 && (
                  <p
                    className="text-[12px] tracking-[0.15em] uppercase mt-1 font-semibold"
                    style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                  >
                    {items.length} {items.length === 1 ? "item selecionado" : "itens selecionados"}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[#A39683] hover:text-[#F2EDE4] transition-colors p-2 border border-white/5 bg-[#0C0B09]/40"
                style={{ borderRadius: "2px" }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable Items Feed Layout Container */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <style>{`div::-webkit-scrollbar { width: 3px; } div::-webkit-scrollbar-thumb { background: #E5C995; }`}</style>
              
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div
                    className="text-6xl mb-5 font-light select-none"
                    style={{ fontFamily: "'Playfair Display', serif", color: "rgba(229, 201, 149, 0.08)" }}
                  >
                    ∅
                  </div>
                  <p
                    className="text-[15px] leading-relaxed"
                    style={{ color: "#A39683", fontFamily: "'Jost', sans-serif", fontWeight: 400 }}
                  >
                    Seu carrinho está vazio.
                    <br />
                    <span className="text-[13px] text-[#E5C995]/60 block mt-2 font-medium tracking-wide">Explore nosso acervo e adicione fragrâncias.</span>
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    if (!item?.product) return null; // Graceful skip for corrupted state items
                    
                    return (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-5 pb-6 border-b border-white/5 items-center"
                      >
                        {/* Imagery Viewport */}
                        <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-[#12110F] border border-white/5" style={{ borderRadius: "2px" }}>
                          <img
                            src={item.product.image || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600"}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content Specifications Grid Column */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] tracking-[0.15em] uppercase font-bold mb-0.5"
                            style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                          >
                            {item.product.brand || "Axis Collection"}
                          </p>
                          
                          <p
                            className="mb-1 truncate text-[1.05rem] font-medium"
                            style={{ fontFamily: "'Playfair Display', serif", color: "#F2EDE4" }}
                          >
                            {item.product.name}
                          </p>
                          
                          <p
                            className="text-[13px] mb-3 font-medium tracking-wide"
                            style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
                          >
                            {item.product.concentration || "EDP"} · {item.product.family || "Fragrância"}
                          </p>
                          
                          {/* Item Actions Sub-Bar */}
                          <div className="flex items-center justify-between">
                            
                            {/* Quantity Controllers */}
                            <div className="flex items-center gap-1.5 border border-white/10 bg-[#12110F]" style={{ borderRadius: "2px" }}>
                              <button
                                onClick={() => onUpdateQty(item.product.id, -1)}
                                className="w-8 h-8 flex items-center justify-center text-[#A39683] hover:text-[#F2EDE4] transition-colors"
                              >
                                <Minus size={11} strokeWidth={2.5} />
                              </button>
                              <span
                                className="text-[14px] w-5 text-center font-bold"
                                style={{ color: "#F2EDE4", fontFamily: "'Jost', sans-serif" }}
                              >
                                {item.qty}
                              </span>
                              <button
                                onClick={() => onUpdateQty(item.product.id, 1)}
                                className="w-8 h-8 flex items-center justify-center text-[#A39683] hover:text-[#F2EDE4] transition-colors"
                              >
                                <Plus size={11} strokeWidth={2.5} />
                              </button>
                            </div>

                            {/* Item Pricing Nodes and Destruction Trigger */}
                            <div className="flex items-center gap-4">
                              <span
                                className="font-semibold text-[1.05rem]"
                                style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
                              >
                                {((item.product.priceNum || 0) * item.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                              <button
                                onClick={() => onRemove(item.product.id)}
                                className="text-[#A39683] hover:text-red-400 transition-colors p-1.5"
                              >
                                <Trash2 size={15} strokeWidth={2} />
                              </button>
                            </div>

                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Sticky Action Footer Context */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-white/5 bg-[#11100E]/20">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[13px] tracking-[0.2em] uppercase font-bold"
                    style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                  >
                    Subtotal
                  </span>
                  <span
                    className="font-bold text-[1.4rem]"
                    style={{ fontFamily: "'Jost', sans-serif", color: "#E5C995" }}
                  >
                    {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                
                {/* Fixed Contrast & Font Weight for High-Readability Shipping Label */}
                <p
                  className="text-[12px] mb-6 font-medium leading-relaxed"
                  style={{ color: "#D1C9BC", fontFamily: "'Jost', sans-serif" }}
                >
                  Frete calculado no checkout · Entrega grátis acima de R$ 500
                </p>
                
                <button
                  onClick={onCheckout}
                  className="w-full py-4.5 text-[13px] tracking-[0.2em] uppercase transition-all duration-300 font-bold shadow-xl"
                  style={{
                    backgroundColor: "#F2EDE4",
                    color: "#0C0B09",
                    fontFamily: "'Jost', sans-serif",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5C995"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F2EDE4"; }}
                >
                  Finalizar Com Purchase
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}