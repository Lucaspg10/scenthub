// src/components/Header.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, User, ShoppingCart, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Product } from "./ProductCard";
import { UserProfileModal } from "./UserProfileModal";

/*
  Developer Note: Fully hardened Header with null-safe data access throughout.
  Architecture: Inline search bar (Roblox Studio style) replaces the SearchModal trigger.
  Icon order: Search → Avatar → Cart → LogOut (rightmost).
  Mobile menu preserves all actions including logout and profile.
  Search filters locally against `products` prop by name and store name.

  FIX 1 — "Perfumes" button (desktop + mobile):
    Both buttons now call `onSearchOpen()` directly, which triggers the full
    SearchModal catalog overlay managed by Home.tsx state.
    Previously they called `scrollToNossaCasa()`, which was semantically wrong
    and caused a silent scroll instead of opening the catalog popup.

  Comments and dev logs: English only.
  User-facing labels: Portuguese only.
*/

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  cartCount: number;
  products: Product[];
  onCartOpen: () => void;
  onAuthOpen: () => void;
  onOpenDetails: (product: Product) => void;
  onSearchOpen: () => void; // Opens the full SearchModal catalog overlay
  isAuthenticated: boolean;
  user: any; // Flexible to accommodate multi-stage backend hydration safely
  onLogout: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({
  cartCount,
  products,
  onCartOpen,
  onAuthOpen,
  onOpenDetails,
  onSearchOpen,
  isAuthenticated,
  user,
  onLogout,
}: HeaderProps) {
  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Ref to close dropdown on outside click
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input whenever the search bar slides open
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery("");
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smooth scroll handler for "Nossa Casa" section
  const scrollToNossaCasa = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("nossa-casa");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  // Toggle inline search bar
  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery(""); // Clear query when closing
      return !prev;
    });
  };

  // Open profile modal only when authenticated; otherwise open auth modal
  const handleAvatarClick = () => {
    if (isAuthenticated) {
      setProfileModalOpen(true);
    } else {
      onAuthOpen();
    }
    setMobileMenuOpen(false);
  };

  // FIX 1: "Perfumes" button handler — opens the full catalog SearchModal overlay
  const handlePerfumesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onSearchOpen(); // Delegates to Home.tsx state: setIsSearchOpen(true)
  };

  // Safely extract user initial for the avatar badge
  const userInitial: string = (() => {
    const nick: string = user?.nickname ?? user?.username ?? "";
    return nick.trim().charAt(0).toUpperCase();
  })();

  // ─── Inline Search Logic ──────────────────────────────────────────────────

  // Filter products by name or store name (null-safe at every access)
  const searchResults: Product[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts.filter((p) => {
      if (!p) return false;
      const nameMatch = (p.name ?? "").toLowerCase().includes(q);
      const storeMatch =
        (p.store_name ?? "").toLowerCase().includes(q) ||
        (p.shopName ?? "").toLowerCase().includes(q);
      return nameMatch || storeMatch;
    });
  }, [searchQuery, products]);

  const hasQuery = searchQuery.trim().length > 0;
  const showDropdown = searchOpen && hasQuery;

  // Handle clicking a search result item
  const handleResultClick = (product: Product) => {
    onOpenDetails(product);
    setSearchQuery("");
    setSearchOpen(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Main Header Bar ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0C0B09]/90 backdrop-blur-md">

        {/* Top Row: Nav | Logo | Icons */}
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 md:h-[72px] flex items-center justify-between gap-8">

          {/* ── Left Navigation Links ──────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-10 flex-1">
            {/* FIX 1 (Desktop): "Perfumes" now calls onSearchOpen() to open the catalog overlay */}
            <button
              type="button"
              onClick={handlePerfumesClick}
              className="text-[14px] tracking-[0.15em] uppercase font-semibold transition-colors duration-300 bg-transparent border-none outline-none cursor-pointer p-0 text-[#A39683] hover:text-[#F2EDE4]"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Perfumes
            </button>

            <a
              href="#nossa-casa"
              onClick={scrollToNossaCasa}
              className="text-[14px] tracking-[0.15em] uppercase font-semibold transition-colors duration-300 text-[#A39683] hover:text-[#F2EDE4]"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Nossa Casa
            </a>
          </nav>

          {/* ── Center Logo ────────────────────────────────────────────── */}
          <div className="flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 pointer-events-none">
            <span
              className="text-2xl md:text-3xl tracking-[0.3em] uppercase text-[#F2EDE4] select-none"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
            >
              Your Essence
            </span>
          </div>

          {/* ── Right Icon Row ─────────────────────────────────────────── */}
          <div className="flex items-center gap-5 md:gap-7 flex-1 justify-end">

            {/* 1. Search toggle (Lupa) */}
            <button
              onClick={handleToggleSearch}
              className="transition-colors duration-300 p-1 text-[#A39683] hover:text-[#F2EDE4] bg-transparent border-none outline-none cursor-pointer"
              aria-label="Pesquisar"
            >
              {searchOpen ? (
                <X size={21} strokeWidth={2} />
              ) : (
                <Search size={21} strokeWidth={2} />
              )}
            </button>

            {/* 2. Avatar / Account (desktop only) */}
            <button
              onClick={handleAvatarClick}
              className="transition-colors duration-300 hidden lg:flex items-center justify-center p-1 text-[#A39683] hover:text-[#F2EDE4] bg-transparent border-none outline-none cursor-pointer"
              aria-label="Meu Perfil"
            >
              {isAuthenticated && userInitial ? (
                <div
                  className="w-6 h-6 rounded-full bg-[#A39683]/20 border border-[#A39683]/40 flex items-center justify-center text-[10px] font-bold text-[#F2EDE4] uppercase overflow-hidden"
                >
                  {userInitial}
                </div>
              ) : (
                <User size={21} strokeWidth={2} />
              )}
            </button>

            {/* 3. Cart */}
            <button
              onClick={onCartOpen}
              className="transition-colors duration-300 relative p-1 text-[#A39683] hover:text-[#F2EDE4] bg-transparent border-none outline-none cursor-pointer"
              aria-label="Carrinho"
            >
              <ShoppingCart size={21} strokeWidth={2} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                  style={{
                    backgroundColor: "#E5C995",
                    color: "#0C0B09",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {/* 4. Logout — rightmost, desktop only, visible only when authenticated */}
            {isAuthenticated && (
              <button
                onClick={onLogout}
                className="transition-colors duration-300 hidden lg:block p-1 text-[#A39683] hover:text-red-400 bg-transparent border-none outline-none cursor-pointer"
                aria-label="Sair da Conta"
              >
                <LogOut size={21} strokeWidth={2} />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden transition-colors duration-300 p-1 text-[#A39683] hover:text-[#F2EDE4] bg-transparent border-none outline-none cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X size={22} strokeWidth={2} />
              ) : (
                <Menu size={22} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* ── Inline Search Bar (Roblox Studio style) ─────────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-b border-white/5 bg-[#0C0B09]"
            >
              <div
                ref={searchRef}
                className="max-w-xl mx-auto px-6 py-4 relative"
              >
                {/* Compact Pill-Shaped Input Track */}
                <div className="flex items-center gap-0 border border-[#E5C995]/30 bg-black/40 rounded-full overflow-hidden px-2 transition-all duration-300 focus-within:border-[#E5C995] focus-within:bg-black/80">
                  <div className="pl-3 py-2 flex-shrink-0">
                    <Search size={15} strokeWidth={2} style={{ color: "#E5C995" }} />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar perfume ou loja..."
                    className="flex-1 bg-transparent outline-none text-[13px] tracking-wide px-3 py-2 border-none"
                    style={{
                      color: "#F2EDE4",
                      fontFamily: "'Jost', sans-serif",
                      caretColor: "#E5C995",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="pr-3 py-2 text-[#A39683] hover:text-[#F2EDE4] transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
                      aria-label="Limpar busca"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>

                {/* Dropdown Results Layout bounded to matching pill width specs */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 8 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-6 right-6 top-full z-50 border border-white/10 bg-[#0C0B09] shadow-2xl overflow-hidden max-w-xl mx-auto"
                      style={{
                        maxHeight: "280px",
                        overflowY: "auto",
                        scrollbarWidth: "thin",
                      }}
                    >
                      {searchResults.length === 0 ? (
                        <div className="px-6 py-4 text-center">
                          <p
                            className="text-[12px] tracking-[0.12em]"
                            style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                          >
                            Nenhum perfume ou loja encontrados.
                          </p>
                        </div>
                      ) : (
                        <ul>
                          {searchResults.map((product, idx) => {
                            const rawPrice = product?.price ?? product?.priceNum ?? 0;
                            const numPrice = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice)) || 0;
                            const formattedPrice = new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(numPrice);

                            const storeName = product?.store_name || product?.shopName || "Loja Parceira";
                            const imageUrl = product?.image_url || product?.image || "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=80";

                            return (
                              <li key={product?.id ?? idx}>
                                <button
                                  onClick={() => handleResultClick(product)}
                                  className="w-full flex items-center gap-4 px-4 py-2.5 text-left transition-colors duration-150 border-none bg-transparent cursor-pointer border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                                  style={{ fontFamily: "'Jost', sans-serif" }}
                                >
                                  <div className="w-9 h-9 flex-shrink-0 overflow-hidden border border-white/5">
                                    <img src={imageUrl} alt={product?.name ?? "Perfume"} className="w-full h-full object-cover grayscale" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium truncate text-[#F2EDE4]">{product?.name ?? "—"}</p>
                                    <p className="text-[10px] tracking-[0.05em] uppercase mt-0.5 truncate text-[#A39683]">Loja: {storeName}</p>
                                  </div>
                                  <span className="text-[12px] font-semibold text-[#E5C995] font-mono">{formattedPrice}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile Slide-in Menu ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed inset-0 z-40 bg-[#0C0B09] pt-20 pb-8 px-8 overflow-y-auto lg:hidden"
          >
            <nav className="flex flex-col gap-8 mt-8">
              {/* FIX 1 (Mobile): "Perfumes" now also calls onSearchOpen() */}
              <button
                type="button"
                onClick={handlePerfumesClick}
                className="text-left text-2xl tracking-[0.08em] text-[#F2EDE4] border-b border-white/5 pb-4 font-medium bg-transparent border-none outline-none cursor-pointer p-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Perfumes
              </button>

              {/* Nossa Casa */}
              <a
                href="#nossa-casa"
                onClick={scrollToNossaCasa}
                className="text-2xl tracking-[0.08em] text-[#F2EDE4] border-b border-white/5 pb-4 font-medium"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Nossa Casa
              </a>

              {/* Profile / Login */}
              <button
                onClick={handleAvatarClick}
                className="flex items-center gap-3 font-semibold uppercase tracking-wider text-[13px] text-[#A39683] bg-transparent border-none outline-none cursor-pointer p-0"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                <User size={18} strokeWidth={2} />
                <span>{isAuthenticated ? "Meu Perfil" : "Minha Conta"}</span>
              </button>

              {/* Logout (mobile) */}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-3 font-semibold uppercase tracking-wider text-[13px] text-red-400/80 bg-transparent border-none outline-none cursor-pointer p-0 text-left"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  <LogOut size={18} strokeWidth={2} />
                  <span>Sair da Conta</span>
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── User Profile Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {profileModalOpen && isAuthenticated && (
          <UserProfileModal
            profileData={user ?? {}}
            onClose={() => setProfileModalOpen(false)}
            onOpenDetails={onOpenDetails}
          />
        )}
      </AnimatePresence>
    </>
  );
}