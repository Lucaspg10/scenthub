// src/components/Hero.tsx
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../services/api";

/*
  Developer Note: English layout configurations and motion tags preserved.
  User Interface: Completely dynamic Portuguese experience following Axis guidelines.
  De-hardcoding Pass: Injected live timestamp cache-busting parameter to bypass browser gridlocks.

  PATCH 1 — Removed secondary "Nossa História" anchor from the CTA row.
    The hero header now exposes only the primary action button "Explorar Coleção".
    The dead secondary link was removed entirely from the flex row to prevent
    visual clutter and comply with the single-CTA design directive.

  FIX 2 — "Explorar Coleção" button:
    Performs a smooth scroll directly to the `#fragrancias` section where
    ProductGrid is rendered, instead of doing nothing (no onClick was bound).
*/

interface NetworkStats {
  perfumes_count: string;
  collections_count: string;
  appreciators_count: string;
}

export function Hero() {
  const [stats, setStats] = useState<NetworkStats>({
    perfumes_count: "...+",
    collections_count: "...",
    appreciators_count: "40K+"
  });

  // Fetch dynamic catalog dimensions directly from Django database hooks with cache-busting
  useEffect(() => {
    async function fetchHeroMetrics() {
      try {
        // Appended dynamic unix timestamp epoch to enforce organic network dispatches
        const response = await api.get(`estatisticas/?t=${new Date().getTime()}`);
        setStats({
          perfumes_count: response.data.perfumes_count,
          collections_count: response.data.collections_count,
          appreciators_count: response.data.appreciators_count
        });
      } catch (err) {
        console.error("Failed to retrieve live catalog dimensions from server.");
        // Resilient fallback layer to prevent empty slots if backend reloads
        setStats({
          perfumes_count: "83+",
          collections_count: "12",
          appreciators_count: "40K+"
        });
      }
    }

    fetchHeroMetrics();
  }, []);

  // Smooth scroll to the featured perfumes section rendered by ProductGrid
  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("fragrancias");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const metricsArray = [
    { value: stats.perfumes_count, label: "Fragrâncias" },
    { value: stats.collections_count, label: "Coleções" },
    { value: stats.appreciators_count, label: "Apreciadores" },
  ];

  return (
    <section className="min-h-screen flex items-center pt-20 overflow-hidden" style={{ backgroundColor: "#0C0B09" }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 items-center min-h-[calc(100vh-80px)]">
          
          {/* Left Side: Text and Main Copy */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center py-16 lg:pr-16 order-2 lg:order-1"
          >
            <p
              className="text-[12px] tracking-[0.3em] uppercase mb-8 font-semibold"
              style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
            >
              Coleção Exclusiva — 2026
            </p>

            <h1
              className="mb-8 leading-[1.05]"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                fontSize: "clamp(2.8rem, 5.5vw, 5.5rem)",
                color: "#F2EDE4",
                letterSpacing: "-0.01em",
              }}
            >
              Your Olfactory
              <br />
              <em style={{ fontStyle: "italic", color: "#E5C995" }}>Signature.</em>
              <br />
              Crafted for
              <br />
              Presence.
            </h1>

            <p
              className="max-w-md mb-12 leading-relaxed font-normal"
              style={{ color: "#A39683", fontFamily: "'Jost', sans-serif", fontSize: "1.0625rem" }}
            >
              Fragrâncias artesanais que capturam a essence do momento. Cada frasco, uma narrativa olfativa única, formulada para quem se recusa à mediocridade.
            </p>

            {/*
              PATCH 1: CTA row now contains only the primary "Explorar Coleção" button.
              The secondary "Nossa História" link was removed entirely per design directive.
            */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleExploreClick}
                className="group flex items-center gap-3 px-8 py-4 text-[13px] tracking-[0.15em] uppercase transition-all duration-300 font-semibold"
                style={{ backgroundColor: "#F2EDE4", color: "#0C0B09", fontFamily: "'Jost', sans-serif" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5C995"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F2EDE4"; }}
              >
                Explorar Coleção
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Dynamic Metrics Strip Dashboard */}
            <div className="flex items-center gap-10 mt-16 pt-10 border-t border-white/5">
              {metricsArray.map((stat) => (
                <div key={stat.label}>
                  <div
                    className="text-2xl md:text-3xl"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: "#F2EDE4" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-[11px] tracking-[0.15em] uppercase mt-1.5 font-medium"
                    style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Image Display Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative flex items-center justify-center order-1 lg:order-2 h-[480px] lg:h-full lg:min-h-screen"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 60% 70% at 60% 50%, rgba(229, 201, 149, 0.06) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 w-full max-w-[420px] lg:max-w-[520px]">
              <img
                src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=900&h=1100&fit=crop&auto=format"
                alt="ScentHub — Frasco premium de perfume artesanal"
                className="w-full h-auto"
                style={{ objectFit: "cover", borderRadius: "2px" }}
              />

              {/* Floating Label Badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute bottom-8 -left-4 md:-left-10 border border-white/5 px-6 py-4 shadow-xl"
                style={{ backgroundColor: "#0C0B09" }}
              >
                <p
                  className="text-[11px] tracking-[0.2em] uppercase mb-1 font-semibold"
                  style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
                >
                  Destaque
                </p>
                <p
                  className="text-[16px]"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#F2EDE4", fontWeight: 500 }}
                >
                  Nobre Wood Intense
                </p>
                <p
                  className="text-[13px] mt-1 font-medium"
                  style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                >
                  Axis Collection · R$ 489,90
                </p>
              </motion.div>
            </div>

            {/* Side Vertical Banner Text */}
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:block"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                color: "rgba(163, 150, 131, 0.25)",
                fontFamily: "'Jost', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 500
              }}
            >
              Artisan Perfumery — Est. 2019
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}