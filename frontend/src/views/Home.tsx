// src/views/Home.tsx
import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { SearchModal } from "../components/SearchModal";
import { AuthModal } from "../components/AuthModal";
import { Cart } from "../components/Cart";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { usePerfumes } from "../hooks/usePerfumes";
import { type Product } from "../components/ProductCard";
import { Sparkles } from "lucide-react";
import { api } from "../services/api";

/*
  Developer Note: English layer properties and hooks preserved for architectural stability.
  User Interface: Premium high-contrast Portuguese layout aligned with Axis luxury design rules.
  Data Pipeline: Feeds global database product stream into the interactive SearchModal grid layer.

  FIX 1 — "Perfumes" button wiring:
    Header now receives `onSearchOpen` which sets `isSearchOpen = true`,
    causing the full-screen SearchModal catalog to open immediately.
    The Header.tsx fix redirects both desktop and mobile "Perfumes" buttons
    to call this prop instead of scrolling to "Nossa Casa".

  FIX 2 — "Explorar Coleção" and "Nossa História" scroll:
    Handled inside Hero.tsx — no state changes required here.
    - "Explorar Coleção" scrolls to `#fragrancias` (ProductGrid section id).
    - "Nossa História" scrolls to `#nossa-casa` (institutional section below).

  FIX 3 — Logout mechanism:
    handleLogout is now a robust async function that:
      1. Reads `axis_refresh_token` from localStorage.
      2. POSTs it to `/api/core/logout/` (Django TokenBlacklistView).
      3. In the `finally` block (always runs, even on network error):
         - Removes `axis_access_token` and `axis_refresh_token` from localStorage.
         - Resets `isAuthenticated` to false.
         - Resets `user` to null.

  FIX BONUS — onSuccess callback on AuthModal:
    After a successful login/register, reads the JWT, fetches the user profile
    from the DRF endpoint and hydrates the `user` state so the avatar initial
    and UserProfileModal are populated immediately.
*/

export function Home() {
  // 1. Database data pipeline via DRF hook
  const { perfumes } = usePerfumes();

  // 2. Global UI orchestration states (Cart and Auth)
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // 3. Advanced search and product detail flow states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 4. Authentication state — starts as false (unauthenticated on fresh load)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Restores session on page refresh if token still exists in storage
    return !!localStorage.getItem("axis_access_token");
  });
  const [user, setUser] = useState<any>(null);
  // Core function to fetch full database account row metrics from Django
  const fetchFullUserProfile = async () => {
    try {
      const response = await api.get("usuarios/perfil/");
      setUser(response.data);
    } catch (err) {
      console.error("Failed to hydrate profile from database ledger:", err);
      // Fallback mechanism parsing minimal data from JWT claims if backend is unreachable
      const token = localStorage.getItem("axis_access_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({ nickname: payload.username || payload.sub || "Usuário" });
        } catch {
          setUser({ nickname: "Usuário" });
        }
      }
    }
  };

  // Triggers pipeline fetch automatically on page refresh (F5) if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFullUserProfile();
    }
  }, [isAuthenticated]);

  // Cart ecosystem strict handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleUpdateQty = (productId: string | number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOpenDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  // ─── FIX 3: Robust async logout handler ───────────────────────────────────
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("axis_refresh_token");

    try {
      if (refreshToken) {
        // Step 1: Blacklist the refresh token on the Django backend.
        // TokenBlacklistView expects { "refresh": "<token>" }
        await api.post("logout/", { refresh: refreshToken });
        console.log("Logout: refresh token successfully blacklisted on server.");
      }
    } catch (err) {
      // Network or server errors are non-fatal — we always clear local state
      console.warn("Logout: server blacklist request failed (proceeding with local cleanup).", err);
    } finally {
      // Step 2: Always clear local tokens and reset auth state regardless of server response
      localStorage.removeItem("axis_access_token");
      localStorage.removeItem("axis_refresh_token");

      // Step 3: Reset global authentication tree
      setIsAuthenticated(false);
      setUser(null);

      console.log("Logout: local session cleared successfully.");
    }
  };

  // ─── FIX BONUS: Hydrate user profile after successful login/register ───────
  // ─── FIX: Hidratação de usuário simplificada (sem quiz) ───────
  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    setIsAuthOpen(false);
    await fetchFullUserProfile(); // Calls the database right after login 200 OK
  };

  return (
    <div
      className="min-h-screen selection:bg-[#E5C995]/20 selection:text-[#E5C995]"
      style={{ backgroundColor: "#0C0B09" }}
    >
      {/*
        Header connected to the unified search trigger of the parent component.
        FIX 1: onSearchOpen now sets isSearchOpen=true, opening the SearchModal catalog.
        FIX 3: onLogout is now the async handleLogout function defined above.
      */}
      <Header
        cartCount={cart.reduce((acc, item) => acc + item.qty, 0)}
        products={perfumes}
        onCartOpen={() => setIsCartOpen(true)}
        onAuthOpen={() => setIsAuthOpen(true)}
        onSearchOpen={() => setIsSearchOpen(true)}
        onOpenDetails={handleOpenDetails}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />

      {/*
        Fixed Header Layout Threshold Spacing Offset.
        pt-20 matches the h-16 (mobile) header; on md+ the header is h-22 but Hero
        has its own pt-20 internally, so this wrapper nudge prevents content flash.
      */}
      <main className="pt-20">
        {/* Visual Entry Block — Explorar Coleção and Nossa História scroll fixed inside Hero.tsx */}
        <Hero />

        {/* Native Product Grid with Backend Connection — id="fragrancias" is the scroll target */}
        <ProductGrid onAddToCart={handleAddToCart} />

        {/*
          Nossa Casa section — scroll target for the Header "Nossa Casa" nav link
          and the Hero "Nossa História" link.
          id="nossa-casa" must exist here for scrollIntoView to succeed.
        */}
        <section
          id="nossa-casa"
          className="py-24 border-t border-white/5 bg-[#0C0B09] text-[#F2EDE4]"
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p
              className="text-[12px] tracking-[0.25em] uppercase mb-4 flex items-center justify-center gap-2 font-semibold"
              style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
            >
              <Sparkles size={13} />
              Alquimia e Identity
            </p>
            <h2
              className="text-3xl md:text-4xl mb-8 font-medium font-serif"
              style={{ color: "#F2EDE4", fontFamily: "'Playfair Display', serif" }}
            >
              Nossa Casa
            </h2>
            <p
              className="text-[15px] leading-relaxed text-[#A39683] max-w-2xl mx-auto mb-12 font-normal"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              A Your Essence não foi moldada para a escala industrial, nascemos para reter a essência.
              Conectamos ateliês e mentes independentes que rejeitam a massificação imposta pelo mercado tradicional,
              favorecendo a rastreabilidade rígida e lotes numerados de altíssima fixação.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { t: "Autenticidade", d: "Cada lote possui certificação de origem direta do mestre perfumista associado." },
                { t: "Rastreabilidade", d: "Auditoria rígida desde a importação do óleo essencial até a entrega da embalagem." },
                { t: "Exclusividade", d: "Sistemas limitados. Quando o estoque zera, a fórmula entra em recesso estratégico." },
              ].map((item) => (
                <div
                  key={item.t}
                  className="p-6 border border-white/5 bg-[#141210]/30 rounded-[2px] transition-colors hover:border-white/10"
                >
                  <h4
                    className="text-[#E5C995] uppercase tracking-widest text-[11px] font-bold mb-2.5"
                    style={{ fontFamily: "'Jost', sans-serif" }}
                  >
                    {item.t}
                  </h4>
                  <p
                    className="text-xs text-[#A39683] leading-relaxed font-normal"
                    style={{ fontFamily: "'Jost', sans-serif" }}
                  >
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>

      {/* FIX 1: LAYER HUD — Full-screen catalog overlay triggered by "Perfumes" button */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={perfumes}
        onAddToCart={handleAddToCart}
        onOpenDetails={handleOpenDetails}
      />

      {/* Lateral flow control modals */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          if (!isAuthenticated) {
            setIsAuthOpen(true);
          } else {
            console.log("Executing checkout pipeline.");
          }
        }}
      />

      {/*
        FIX 3: onSuccess now calls handleAuthSuccess which hydrates user state
        and flips isAuthenticated to true after tokens are stored by AuthModal.
      */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        mode="login"
        onSuccess={handleAuthSuccess}
      />

      {/* Individual fragrance detail modal */}
      <ProductDetailModal
        isOpen={isDetailsOpen}
        product={selectedProduct}
        onClose={() => setIsDetailsOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}