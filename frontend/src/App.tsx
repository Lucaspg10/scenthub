// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./views/Home";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
 
/*
  Developer Note: Structural root assembly and global state mapping engine.
  Refactor: Delegated all state orchestration (cart, auth, search, details) to Home.tsx.
  The root "/" route now mounts <Home />, which owns its own Header and full state tree.
  This eliminates the previous conflict where App.tsx mounted a stateless Header
  without onSearchOpen / onOpenDetails / products props, breaking the search flow.
  User Interface: 100% compliant with premium Portuguese localization parameters.
*/
 
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Core Home Hub Route — full orchestration delegated to Home view */}
        <Route path="/" element={<Home />} />
 
        {/* Deep Exploration Catalog Viewport — standalone route with its own minimal shell */}
        <Route
          path="/perfumes"
          element={
            <div className="min-h-screen bg-[#0C0B09] selection:bg-[#C9A96E] selection:text-[#0C0B09]">
              {/*
                Developer Note: This standalone /perfumes route intentionally does not share
                state with Home.tsx. If cart/auth is needed here in the future,
                lift state to a Context or Zustand store.
              */}
              <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
                <h1
                  className="text-4xl uppercase tracking-[0.2em] font-light mb-12 text-[#F2EDE4]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Acervo Completo
                </h1>
                <ProductGrid onAddToCart={() => {}} />
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
 
export default App;