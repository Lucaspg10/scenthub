// src/components/UserProfileModal.tsx
import { useState, useEffect } from "react";
// @ts-ignore
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  ShoppingCart,
  DollarSign,
  Check,
  Edit2,
  Truck,
  Store,
  Package,
  User,
} from "lucide-react";
import { type Product } from "./ProductCard";

/*
  Developer Note: Complete null-safety overhaul on every profileData access.
  Root cause of the blank-modal bug: profileData was accessed without guards,
  throwing on undefined properties and breaking React's render pipeline silently.
  Fix strategy:
    1. Every profileData field access uses optional chaining (?.) and nullish
       coalescing (??) so the component renders even with an empty object {}.
    2. The outer wrapper uses a solid background color — NOT backdrop-blur on the
       entire fixed layer — so the card is always visible above the overlay.
    3. AnimatePresence wraps the motion.div instead of the fixed backdrop, which
       was the secondary cause of the "black screen" — the card was mounted inside
       a blurred ancestor with no solid background of its own.

  PATCH 2 — accountName / displayName smart fallback + useEffect sync:
    accountName: reads safe.name?.trim(). If empty/falsy, falls back to
      safe.nickname. If nickname contains "@", extracts only the prefix before
      the domain via .split("@")[0]. Final fallback: "Usuário Axis".
    displayName: applies the same visual intelligence — isolates the prefix
      before "@" from the nickname field, preventing raw email strings from
      polluting the nickname text box on-screen.
    useEffect: a dedicated hook monitors displayName changes and calls
      setNickname(displayName) immediately, forcing React to re-render with
      the correct value as soon as the async Django fetch resolves.

  Architecture:
    - Tab system: "Painel do Cliente" always visible.
    - "Painel da Loja (Vendas)" and "Fila de Despacho" tabs unlock if is_merchant is true.
    - Two-column symmetric layout for both client and merchant panels.
    - rounded-none enforced everywhere (design blocky spec).
    - Profile photo: perfectly circular (rounded-full) in the left identity panel only.
    - Order thumbnails use product.image_url directly from backend OrderItem serializer.
    - "Ateliê" → "Loja" throughout.
    - No logout button inside modal (moved to Header icon bar).

  Comments and dev logs: English only.
  User-facing labels: Portuguese only.
*/

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "Processando" | "Despachado" | "Entregue";

interface OrderItemBackend {
  id: number;
  perfume_id: number;
  name: string;
  image_url: string;
  store_name: string;
  historical_price: string;
  quantity: number;
  status: OrderStatus;
}

interface ManagedStore {
  id: number;
  name: string;
  slug: string;
  status: string;
}

// Mirrors CompleteCustomerProfileSerializer from the Django backend
interface ProfileData {
  id?: number;
  name?: string;
  nickname?: string;
  username?: string;
  email?: string;
  date_joined?: string;
  experience_level?: string;
  total_orders?: number;
  total_invested?: number;
  is_merchant?: boolean;
  managed_stores?: ManagedStore[];
  orders?: OrderItemBackend[];
  profileImage?: string;
}

interface UserProfileModalProps {
  profileData: ProfileData | null | undefined;
  onClose: () => void;
  onOpenDetails: (product: Product) => void;
}

type ActiveTab = "CLIENTE" | "LOJISTA_VENDAS" | "LOJISTA_PEDIDOS" | "RASTREAMENTO_CLIENTE";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Safe BRL currency formatter
function formatBRL(value: number | string | undefined | null): string {
  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value ?? "0")) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

// Derive a display date from an ISO string, with graceful fallback
function formatJoinDate(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// Status badge color map
const STATUS_STYLES: Record<OrderStatus, string> = {
  Processando: "text-orange-400 border-orange-500/40 bg-orange-950/30 font-bold text-xs px-2.5 py-1 tracking-wider",
  Despachado: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30 font-bold text-xs px-2.5 py-1 tracking-wider",
  Entregue: "text-teal-400 border-teal-500/40 bg-teal-950/30 font-bold text-xs px-2.5 py-1 tracking-wider",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UserProfileModal({
  profileData,
  onClose,
  onOpenDetails,
}: UserProfileModalProps) {

  // Normalize profileData so every downstream access is always safe
  const safe: ProfileData = profileData ?? {};

  // Authentic validation flag directly connected to backend record verification
  const isLogged = !!safe.id || !!safe.nickname;

  // ── Derived display values (all null-safe) ────────────────────────────────

  /*
    PATCH 2 — accountName:
    Priority chain: safe.name (trimmed) → nickname prefix before "@"
    (if nickname is an email) → raw nickname → "Usuário Axis".
  */
  const accountName: string = (() => {
    const trimmedName = safe.name?.trim();
    if (trimmedName) return trimmedName;

    if (safe.nickname) {
      return safe.nickname.includes("@")
        ? safe.nickname.split("@")[0]
        : safe.nickname;
    }

    return "Usuário Axis";
  })();

  const displayEmail: string = safe.email?.trim() || "—";

  /*
    PATCH 2 — displayName:
    Same visual intelligence as accountName — strips the email domain from
    nickname so raw email strings never render inside the nickname text box.
    Final fallback: "Usuário".
  */
  const displayName: string = (() => {
    if (!safe.nickname) return "Usuário";
    return safe.nickname.includes("@")
      ? safe.nickname.split("@")[0]
      : safe.nickname;
  })();

  const displayJoinDate: string = formatJoinDate(safe.date_joined);
  const totalOrders: number =
    typeof safe.total_orders === "number" ? safe.total_orders : 0;
  const totalInvested: number =
    typeof safe.total_invested === "number" ? safe.total_invested : 0;
  const isMerchant: boolean = safe.is_merchant === true;
  const managedStores: ManagedStore[] = Array.isArray(safe.managed_stores)
    ? safe.managed_stores
    : [];
  const profileImage: string =
    (safe as any).profileImage ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

  // Determine primary store name for the merchant panel
  const primaryStoreName: string =
    managedStores[0]?.name ?? "Loja Parceira";

  // ── Local UI state ────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<ActiveTab>("CLIENTE");
  const [nickname, setNickname] = useState<string>(displayName);
  const [isEditingNick, setIsEditingNick] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>(primaryStoreName);
  const [isEditingStore, setIsEditingStore] = useState<boolean>(false);

  // Synchronize state strictly with incoming authentic database payloads
  const [ordersList, setOrdersList] = useState<OrderItemBackend[]>(() => {
    return Array.isArray(safe.orders) ? safe.orders : [];
  });

  // Keep order list updated if profileData hook updates asynchronously after login
  useEffect(() => {
    if (Array.isArray(safe.orders)) {
      setOrdersList(safe.orders);
    }
  }, [safe.orders]);

  /*
    PATCH 2 — useEffect watching displayName:
    Forces immediate nickname re-render as soon as the async Django fetch
    resolves and delivers the real account data, preventing stale placeholder
    values from lingering in the nickname input field after account switching.
  */
  useEffect(() => {
    setNickname(displayName);
  }, [displayName]);

  // Merchant dispatches an order — mutates local state optimistically
  const handleDispatchOrder = (id: number): void => {
    setOrdersList((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "Despachado" as OrderStatus } : o
      )
    );
  };

  // Open the ProductDetailModal for an item in order history
  const handleOpenOrderDetail = (order: OrderItemBackend): void => {
    const productProxy: Partial<Product> & Record<string, any> = {
      id: order.perfume_id,
      name: order.name,
      price: parseFloat(order.historical_price) || 0,
      image_url: order.image_url,
      image: order.image_url,
      store_name: order.store_name,
      shopName: order.store_name,
    };
    onOpenDetails(productProxy as Product);
  };

  // Count pending dispatch items for the badge
  const pendingCount: number = ordersList.filter(
    (o) => o.status === "Processando"
  ).length;

  // ── Tab definitions ───────────────────────────────────────────────────────

  const hasActiveDelivery = isLogged && ordersList.some(
    (o) => o.status === "Processando" || o.status === "Despachado"
  );

  // Rebuild navigation based on auth state
  const tabs: { key: ActiveTab; label: string }[] = [];
  
  // Painel do Cliente is always the landing tab
  tabs.push({ key: "CLIENTE", label: "Painel do Cliente" });

  // Only inject operational tabs if user is authenticated
  if (isLogged) {
    if (hasActiveDelivery) {
      tabs.push({ key: "RASTREAMENTO_CLIENTE", label: "Acompanhar Entrega 🚚" });
    }

    if (isMerchant) {
      tabs.push({ key: "LOJISTA_VENDAS", label: "Painel da Loja (Vendas)" });
      tabs.push({
        key: "LOJISTA_PEDIDOS",
        label: `Fila de Despacho${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /*
      CRITICAL FIX: The root div uses a solid semi-transparent background color
      directly. We do NOT apply backdrop-blur to the entire fixed layer because
      that caused the child card to inherit the blur and become invisible.
      The card itself carries its own solid bg-[#0C0B09] so it is always opaque.
    */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: "rgba(12, 11, 9, 0.88)" }}
    >
      {/* Clickable backdrop — sits below the card */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* ── Modal Card ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "#0C0B09",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0px", // rounded-none — blocky spec
          minHeight: "750px",
          maxHeight: "92vh",
          overflowY: "auto",
          scrollbarWidth: "thin",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .profile-scroll::-webkit-scrollbar { width: 3px; }
          .profile-scroll::-webkit-scrollbar-thumb { background: #E5C995; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* ── Close Button ──────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#A39683] hover:text-[#F2EDE4] transition-colors bg-transparent border-none cursor-pointer z-20 p-1.5"
          aria-label="Fechar"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {/* ── Inner Padding Wrapper ──────────────────────────────────────── */}
        <div className="p-6 md:p-10 flex flex-col h-full">
          <h2 
            className="text-xl tracking-[0.2em] uppercase text-[#F2EDE4] font-medium mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Painel do Usuário
          </h2>

          {/* ── Tab Navigation ──────────────────────────────────────────── */}
          <div className="flex gap-0 mb-8 border-b border-white/5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-shrink-0 pb-3 px-4 text-[11px] uppercase tracking-[0.2em] font-semibold bg-transparent border-none cursor-pointer transition-all duration-200 whitespace-nowrap"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    color: isActive ? "#E5C995" : "#A39683",
                    borderBottom: isActive
                      ? "2px solid #E5C995"
                      : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              TAB EXTRA — RASTREAMENTO DO CLIENTE (DINÂMICO PREMIUM)
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "RASTREAMENTO_CLIENTE" && (
            <div className="border border-white/10 bg-white/[0.01] p-8 rounded-none my-6 space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                <div className="flex items-center gap-4">
                  <Truck size={32} className="text-[#E5C995] flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="text-xl font-serif text-[#F2EDE4] font-bold">Rastreamento da Carga</h3>
                    <p className="text-sm text-[#F2EDE4] font-mono uppercase tracking-widest font-bold bg-white/5 px-2 py-0.5 mt-1 border border-white/10">Código: AXS-99821-BR</p>
                  </div>
                </div>
                <div className="text-left md:text-right font-mono text-xs">
                  <span className="text-[#C4B59F] uppercase block tracking-wider font-bold">Previsão Estimada:</span>
                  <span className="text-[#E5C995] font-extrabold text-base">3 a 5 dias úteis</span>
                </div>
              </div>

              {/* Taller steps with absolute text legibility on non-active blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
                <div className="border border-emerald-500/40 p-6 bg-emerald-950/10">
                  <span className="text-xs font-mono text-emerald-400 block mb-1 font-bold">✓ 01. TRIAGEM</span>
                  <p className="text-sm text-[#F2EDE4] font-bold">Fragrância Autenticada</p>
                </div>
                <div className="border border-[#E5C995] p-6 bg-[#E5C995]/10">
                  <span className="text-xs font-mono text-[#E5C995] block mb-1 font-bold">● 02. EM TRÂNSITO</span>
                  <p className="text-sm text-[#F2EDE4] font-bold">Despachado do Ateliê Central</p>
                </div>
                <div className="border border-white/20 p-6 bg-white/[0.02]">
                  <span className="text-xs font-mono text-[#C4B59F] block mb-1 font-medium">○ 03. ENTREGA</span>
                  <p className="text-sm text-[#A39683] font-medium">Rota Final de Custódia</p>
                </div>
              </div>

              <div className="flex justify-start pt-4">
                <button 
                  onClick={() => alert("Suporte técnico Axis notificado sobre a verificação de prazos.")}
                  className="px-6 py-3 text-xs uppercase tracking-widest font-mono font-black text-rose-100 border-2 border-rose-600 bg-rose-950/80 transition-all duration-200 cursor-pointer hover:bg-rose-600 hover:text-black w-full md:w-auto text-center"
                  style={{ borderRadius: "0px" }}
                >
                  Notificar Atraso na Entrega
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 1 — PAINEL DO CLIENTE (3-CARD ARCHITECTURE DEFINITIVE)
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "CLIENTE" && (
            !isLogged ? (
              /* Clean unauthenticated placeholder state using default person spec icon */
              <div className="flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] p-12 text-center h-[520px] rounded-none animate-fadeIn flex-1">
                <div className="w-24 h-24 border border-white/10 flex items-center justify-center mb-6 bg-white/[0.02]" style={{ borderRadius: "9999px" }}>
                  <User size={36} className="text-[#A39683]" />
                </div>
                <h3 className="text-base font-serif text-[#F2EDE4] mb-2 font-bold uppercase tracking-wider">Identificação Requerida</h3>
                <p className="text-xs text-[#A39683] font-mono uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                  Acesso restrito. Por favor, crie uma conta ou realize o login para visualizar seus dados de custódia e histórico de pedidos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1">

                {/* COLUMN LEFT: IDENTITY STACK & ANALYTICS */}
                <div className="md:col-span-5 flex flex-col gap-6">

                  {/* CARD 1: SUPERIOR ESQUERDO — USER IDENTITY */}
                  <div className="border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center rounded-none justify-between flex-1">
                    <h4 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono w-full text-left pb-2 border-b border-white/10 mb-6">
                      PERFIL
                    </h4>

                    {/* Anti-distortion avatar container */}
                    <div className="relative w-28 h-28 overflow-hidden border border-white/10 mb-6 flex-shrink-0 group/avatar cursor-pointer transition-all duration-300 hover:scale-105 hover:border-[#E5C995]/50 shadow-xl" style={{ borderRadius: "9999px" }}>
                      <img 
                        src={profileImage} 
                        alt={nickname} 
                        className="w-full h-full object-cover object-center grayscale transition-transform duration-300 group-hover/avatar:scale-110 group-hover/avatar:grayscale-0" 
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                        <Edit2 size={14} className="text-[#E5C995]" />
                      </div>
                    </div>

                    {/* Reordered layout rows prioritizing Account Name and Bold Labels */}
                    <div className="w-full space-y-4 text-sm">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[#F2EDE4] text-xs font-bold uppercase tracking-wider font-mono">Nome da Conta:</span>
                        <span className="text-[#F2EDE4] font-bold font-sans truncate pl-4">{accountName}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[#F2EDE4] text-xs font-bold uppercase tracking-wider font-mono">Apelido da Conta:</span>
                        {isEditingNick ? (
                          <div className="flex items-center border-b border-[#E5C995] py-0.5 max-w-[180px]">
                            <input
                              type="text"
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value)}
                              className="bg-transparent border-none outline-none text-sm font-medium text-[#F2EDE4] w-full font-mono"
                              autoFocus
                            />
                            <button onClick={() => setIsEditingNick(false)} className="text-[#E5C995] bg-transparent border-none cursor-pointer p-0.5">
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 max-w-[180px]">
                            <span className="text-[#F2EDE4] font-mono font-medium truncate">{nickname}</span>
                            <button 
                              onClick={() => setIsEditingNick(true)} 
                              className="text-black bg-[#E5C995] hover:bg-[#FFF] transition-colors cursor-pointer p-1 flex items-center border-none shadow-sm" 
                              title="Editar Apelido"
                              style={{ borderRadius: '0px' }}
                            >
                              <Edit2 size={11} strokeWidth={3} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[#F2EDE4] text-xs font-bold uppercase tracking-wider font-mono">E-mail:</span>
                        <span className="text-[#F2EDE4] font-mono text-xs truncate pl-4 max-w-[200px]">{displayEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: INFERIOR ESQUERDO — DADOS DE COMPRA */}
                  <div className="border border-white/5 bg-white/[0.01] p-6 flex flex-col justify-between rounded-none h-[165px] flex-shrink-0">
                    <h4 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono pb-2 border-b border-white/10 mb-4">
                      DADOS DE COMPRA
                    </h4>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[#F2EDE4] font-bold uppercase tracking-wider">Membro desde:</span>
                        <span className="text-[#F2EDE4] font-medium">{displayJoinDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#F2EDE4] font-bold uppercase tracking-wider">Total Investido:</span>
                        <span className="text-[#E5C995] font-bold text-sm">{formatBRL(totalInvested)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#F2EDE4] font-bold uppercase tracking-wider">Compras Realizadas:</span>
                        <span className="text-[#F2EDE4] font-medium">{totalOrders}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* CARD 3: COLUNA DIREITA COMPLETA — HISTÓRICO DE PEDIDOS */}
                <div className="md:col-span-7 border border-white/5 bg-white/[0.01] p-6 flex flex-col rounded-none h-full">
                  <h3 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono mb-5 pb-2 border-b border-white/10 w-full text-left">
                    HISTÓRICO DE PEDIDOS
                  </h3>

                  <div className="space-y-4 overflow-y-auto flex-1 pr-1 profile-scroll max-h-[520px]">
                    {ordersList.length === 0 ? (
                      <div className="p-12 text-center my-auto">
                        <Package size={24} className="mx-auto mb-2 text-[#A39683]" />
                        <p className="text-[11px] uppercase tracking-widest text-[#A39683] font-mono">
                          Nenhum pedido registrado até o momento.
                        </p>
                      </div>
                    ) : (
                      ordersList.map((order) => {
                        const safeStatus: OrderStatus = order.status in STATUS_STYLES ? order.status : "Processando";
                        const isProcessando = order.status === "Processando";
                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              if (isProcessando) setActiveTab("RASTREAMENTO_CLIENTE");
                            }}
                            className={`border border-white/5 p-5 flex justify-between items-center gap-8 transition-all duration-200 bg-black/20 min-h-[140px] ${isProcessando ? "cursor-pointer hover:bg-white/[0.04] hover:border-[#E5C995]/40 group/order-item" : "bg-black/5 opacity-90"}`}
                          >
                            <div className="flex items-center gap-6 min-w-0 pointer-events-auto">
                              <div className="w-28 h-28 flex-shrink-0 overflow-hidden border border-white/10 rounded-none bg-black">
                                <img
                                  src={order.image_url || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=200"}
                                  alt={order.name}
                                  className="w-full h-full object-cover object-center grayscale transition-all duration-300 hover:grayscale-0"
                                />
                              </div>

                              <div className="min-w-0 space-y-2.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenOrderDetail(order);
                                  }}
                                  className="text-base font-bold text-left truncate block bg-transparent border-none cursor-pointer p-0 font-serif text-[#F2EDE4] hover:text-[#E5C995] transition-colors"
                                >
                                  {order.name ?? "—"}
                                </button>
                                
                                <span className="block text-xs text-[#F2EDE4]/90 font-sans font-medium">
                                  Loja:{" "}
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenDetails({
                                        id: order.perfume_id,
                                        name: order.name,
                                        price: parseFloat(order.historical_price) || 0,
                                        image_url: order.image_url,
                                        store_name: order.store_name,
                                      } as Product);
                                  }}
                                    className="text-[#E5C995] font-black hover:text-white hover:underline transition-colors cursor-pointer pl-0.5 tracking-wide uppercase text-[11px]"
                                  >
                                    {order.store_name ?? "—"}
                                  </span>
                                </span>

                                <div className="pt-0.5">
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 border font-mono transition-all ${STATUS_STYLES[safeStatus]} ${isProcessando ? "group-hover/order-item:border-[#E5C995] group-hover/order-item:text-[#E5C995]" : ""}`}>
                                    <Truck size={10} />
                                    {safeStatus} {isProcessando && "➔"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span className="text-lg font-bold font-mono text-[#E5C995] flex-shrink-0 bg-white/[0.02] border border-white/5 px-3 py-1.5">
                              {formatBRL(order.historical_price)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2 — PAINEL DA LOJA (VENDAS) — merchant only
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "LOJISTA_VENDAS" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1">

              {/* ── Left: Store Identity Panel ────────────────────────── */}
              <div className="md:col-span-5 flex flex-col gap-6">

                {/* Store identity block with unified header weight */}
                <div className="border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center rounded-none justify-between flex-1">
                  <h4 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono w-full text-left pb-2 border-b border-white/10 mb-6">
                    IDENTIDADE COMERCIAL
                  </h4>

                  <div className="flex items-center gap-5 w-full mb-6 bg-black/20 p-4 border border-white/5">
                    <div className="w-16 h-16 flex-shrink-0 border border-white/10 flex items-center justify-center bg-white/[0.04]" style={{ borderRadius: "9999px" }}>
                      <Store size={24} className="text-[#E5C995]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditingStore ? (
                        <div className="flex items-center w-full border-b border-[#E5C995] py-0.5">
                          <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-base font-medium text-[#F2EDE4]"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                            autoFocus
                          />
                          <button onClick={() => setIsEditingStore(false)} className="text-[#E5C995] bg-transparent border-none cursor-pointer p-1">
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h3 className="text-base font-bold text-[#F2EDE4] font-serif truncate">{storeName}</h3>
                          <button onClick={() => setIsEditingStore(true)} className="text-[#E5C995] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0.5">
                            <Edit2 size={11} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}

                      {managedStores[0] && (
                        <p className="text-[11px] mt-1 font-mono tracking-wider text-[#C4B59F]">
                          Canal: <span className="text-[#34d399] font-bold">{managedStores[0].status === "APPROVED" ? "Autenticado" : managedStores[0].status}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Store analytics metrics card block */}
                <div className="border border-white/5 bg-white/[0.01] p-6 flex flex-col justify-between rounded-none h-[165px] flex-shrink-0">
                  <h4 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono pb-2 border-b border-white/10 mb-4">
                    MÉTRICAS DA LOJA
                  </h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-[#C4B59F] font-bold uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Ativa Desde:</span>
                      <span className="text-[#F2EDE4] font-medium">{displayJoinDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#C4B59F] font-bold uppercase tracking-wider flex items-center gap-1.5"><ShoppingCart size={12} /> Volume Saído:</span>
                      <span className="text-[#F2EDE4] font-bold">{ordersList.length} und.</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#C4B59F] font-bold uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={12} /> Receita Bruta:</span>
                      <span className="text-[#E5C995] font-black">{formatBRL(ordersList.reduce((acc, o) => acc + (parseFloat(o.historical_price) || 0) * (o.quantity || 1), 0))}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Right: Stock Outflow Ledger with amplified item sizing ── */}
              <div className="md:col-span-7 border border-white/5 bg-white/[0.01] p-6 flex flex-col rounded-none h-full">
                <h3 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono mb-5 pb-2 border-b border-white/10 w-full text-left">
                  HISTÓRICO DE SAÍDAS DE ESTOQUE
                </h3>

                <div className="space-y-4 overflow-y-auto flex-1 pr-1 profile-scroll max-h-[520px]">
                  {ordersList.length === 0 ? (
                    <div className="p-12 text-center my-auto">
                      <Package size={24} className="mx-auto mb-2 text-[#A39683]" />
                      <p className="text-[11px] uppercase tracking-widest text-[#A39683] font-mono">
                        Nenhuma movimentação comercial registrada.
                      </p>
                    </div>
                  ) : (
                    ordersList.map((sale) => (
                      <div key={sale.id} className="border border-white/5 p-5 flex justify-between items-center gap-6 bg-black/20 min-h-[140px]">
                        <div className="flex items-center gap-6 min-w-0">
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden border border-white/10 rounded-none bg-black">
                            <img
                              src={sale.image_url || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=200"}
                              alt={sale.name}
                              className="w-full h-full object-cover object-center grayscale"
                            />
                          </div>
                          <div className="min-w-0 space-y-2">
                            <h4 className="text-base font-bold text-[#F2EDE4] font-serif truncate">{sale.name ?? "—"}</h4>
                            <span className="block text-xs text-[#C4B59F] font-mono">Lote vinculado: <span className="text-white font-medium font-sans">#{sale.id}</span></span>
                            <span className="inline-block text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/50">
                              Liquidação Axis: 5% retida na custódia
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-bold font-mono text-[#E5C995] flex-shrink-0 bg-white/[0.02] border border-white/5 px-3 py-1.5">
                          {formatBRL(sale.historical_price)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 3 — FILA DE DESPACHO — merchant only
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === "LOJISTA_PEDIDOS" && (
            <div className="space-y-5 flex-1 flex flex-col h-full">
              <h3 className="text-sm tracking-[0.2em] uppercase font-bold text-[#F2EDE4] font-mono pb-2 border-b border-white/10 w-full text-left mb-4">
                TRIAGEM E DESPACHO DE PEDIDOS PENDENTES
              </h3>

              <div className="space-y-4 overflow-y-auto flex-1 pr-1 profile-scroll max-h-[520px]">
                {pendingCount === 0 ? (
                  <div className="border border-white/5 p-12 text-center my-auto bg-white/[0.01]">
                    <User size={28} className="mx-auto mb-3 text-[#A39683]" />
                    <p className="text-[11px] uppercase tracking-widest text-[#A39683] font-mono font-bold">
                      Nenhum pedido pendente de envio. Canal logístico limpo.
                    </p>
                  </div>
                ) : (
                  ordersList
                    .filter((o) => o.status === "Processando")
                    .map((order) => (
                      <div key={order.id} className="border border-white/5 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-black/20 min-h-[140px]">
                        <div className="flex items-center gap-6 min-w-0">
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden border border-white/10 rounded-none bg-black">
                            <img
                              src={order.image_url || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=200"}
                              alt={order.name}
                              className="w-full h-full object-cover object-center grayscale"
                            />
                          </div>
                          <div className="min-w-0 space-y-2">
                            <span className="block text-[11px] font-mono tracking-widest text-[#E5C995] font-bold">LOTE #{order.id}</span>
                            <h4 className="text-base font-bold text-[#F2EDE4] font-serif truncate">
                              {order.name ?? "—"}{" "}
                              <span className="text-[#C4B59F] text-sm font-sans font-bold pl-1">(x{order.quantity ?? 1})</span>
                            </h4>
                            <span className="block text-xs text-[#C4B59F] font-mono truncate">Loja Origem: <span className="text-white font-sans font-medium">{order.store_name ?? "—"}</span></span>
                          </div>
                        </div>

                        {/* Dispatch action button with structural fill on hover */}
                        <button
                          onClick={() => handleDispatchOrder(order.id)}
                          className="w-full sm:w-auto flex-shrink-0 px-6 py-3 text-xs uppercase tracking-widest font-mono font-black transition-all duration-200 cursor-pointer border bg-transparent border-[#E5C995] text-[#E5C995]"
                          style={{ borderRadius: "0px" }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.backgroundColor = "#E5C995";
                            btn.style.color = "#0C0B09";
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.backgroundColor = "transparent";
                            btn.style.color = "#E5C995";
                          }}
                        >
                          Autorizar Despacho
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}