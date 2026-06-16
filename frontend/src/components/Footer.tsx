// src/components/Footer.tsx

/*
  Developer Note: English architecture configuration notes and column maps preserved.
  User Interface: Completely formatted in high-contrast Portuguese adhering to Axis standards.
  Color Strategy: Upgraded low-visibility targets to #A39683 and title markers to #E5C995.
*/

export function Footer() {
  const columns = [
    {
      title: "Fragrâncias",
      links: ["Coleção Masculina", "Coleção Feminina", "Unissex", "Edições Limitadas", "Presentes & Kits"],
    },
    {
      title: "Nossa Casa",
      links: ["Nossa História", "Manifesto", "Mestres Perfumistas", "Sustentabilidade", "Blog"],
    },
    {
      title: "Suporte",
      links: ["Guia de Fragrâncias", "Trocas & Devoluções", "Rastrear Pedido", "FAQ", "Contato"],
    },
  ];

  return (
    <footer className="border-t border-white/5 pt-16 pb-10 mt-12" style={{ backgroundColor: "#0C0B09" }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          
          {/* Brand and Manifesto Column */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="block mb-5 text-xl md:text-2xl tracking-[0.3em] uppercase"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: "#F2EDE4" }}
            >
              ScentHub
            </span>
            <p
              className="leading-relaxed mb-6 max-w-[260px] font-normal"
              style={{ color: "#A39683", fontFamily: "'Jost', sans-serif", fontSize: "14px" }}
            >
              Fragrâncias artesanais para quem entende que o aroma é a memória mais persistente.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-9 h-9 border border-white/10 flex items-center justify-center transition-all duration-300"
                style={{ borderRadius: "2px", color: "#A39683" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#F2EDE4"; e.currentTarget.style.borderColor = "rgba(242, 237, 228, 0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#A39683"; e.currentTarget.style.borderColor = "rgba(242, 237, 228, 0.1)"; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 border border-white/10 flex items-center justify-center transition-all duration-300"
                style={{ borderRadius: "2px", color: "#A39683" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#F2EDE4"; e.currentTarget.style.borderColor = "rgba(242, 237, 228, 0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#A39683"; e.currentTarget.style.borderColor = "rgba(242, 237, 228, 0.1)"; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                  <path d="m10 15 5-3-5-3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Dynamic Navigation Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p
                className="text-[12px] tracking-[0.2em] uppercase mb-5 font-semibold"
                style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
              >
                {col.title}
              </p>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[14px] transition-colors duration-200 font-normal"
                      style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                      onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = "#F2EDE4"; }}
                      onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = "#A39683"; }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Subscription Strip */}
        <div className="border-t border-white/10 pt-10 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <p
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.25rem", color: "#F2EDE4" }}
              >
                Receba lançamentos e ofertas exclusivas
              </p>
              <p
                className="text-[14px] mt-1 font-normal"
                style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
              >
                Sem spam. Apenas as melhores novidades para apreciadores legítimos.
              </p>
            </div>
            <div className="flex gap-0 max-w-md w-full">
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 px-5 py-4 outline-none text-[14px] font-normal"
                style={{
                  backgroundColor: "#1A1814",
                  border: "1px solid rgba(242, 237, 228, 0.15)",
                  borderRight: "none",
                  color: "#F2EDE4",
                  fontFamily: "'Jost', sans-serif",
                  borderRadius: "2px 0 0 2px",
                }}
              />
              <button
                className="px-7 py-4 text-[12px] tracking-[0.18em] uppercase whitespace-nowrap transition-all duration-300 font-semibold"
                style={{
                  backgroundColor: "#F2EDE4",
                  color: "#0C0B09",
                  fontFamily: "'Jost', sans-serif",
                  borderRadius: "0 2px 2px 0",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5C995"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F2EDE4"; }}
              >
                Inscrever
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal Layer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8">
          <p
            className="text-[12px] tracking-wide font-normal"
            style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
          >
            © 2026 ScentHub. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            {["Privacidade", "Termos de Uso", "Cookies"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[12px] tracking-wide transition-colors duration-200 font-medium"
                style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = "#F2EDE4"; }}
                onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = "#A39683"; }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}