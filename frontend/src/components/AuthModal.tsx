import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";

/*
  Developer Note: English logs and architectural routing flags preserved.
  User Interface: Completely designed in Portuguese following the Axis luxury identity theme.
  UI Calibration: Standardized width to a stable max-w-[540px] to preserve absolute layout symmetry.
  Readability Pass: Upgraded input text weight to font-normal (400) for high-contrast visibility upon typing.
  Integration Patch: Connected authentication pipeline directly to Django REST SimpleJWT route layers.
*/

interface AuthModalProps {
  isOpen: boolean;
  mode: "login" | "register" | "checkout";
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, mode, onClose, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<"login" | "register">(mode === "register" ? "register" : "login");
  const [role, setRole] = useState<"client" | "merchant">("client"); // Core multi-tenant router
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState(""); // Used explicitly for business profile triage

  // Pipeline feedback state hooks
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isCheckout = mode === "checkout";

  // Reset local state bounds upon node trigger variations
  useEffect(() => {
    if (isOpen) {
      setView(mode === "checkout" ? "login" : mode);
      setApiError(null);
      setLoading(false);
      setConfirmPassword("");
    }
  }, [isOpen, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    // Structural password parity assertion using confirmPassword as a temporary local pivot
    if (view === "register" && password !== confirmPassword) {
      setApiError("As senhas inseridas não coincidem. Verifique a digitação.");
      setLoading(false);
      return;
    }

    console.log("Submitting Axis Payload:", { view, role, name, email, password, storeName });

    try {
      if (view === "login") {
        const response = await api.post("autenticacao/", {
          username: email, // O backend recebe o valor do estado 'email' como username
          password: password,
        });

        localStorage.setItem("axis_access_token", response.data.access);
        localStorage.setItem("axis_refresh_token", response.data.refresh);
        onSuccess();
        onClose();
      } else {
        // Phase 2: Handle Native Account Creation
        if (role === "merchant") {
          // Standard register endpoint handler placeholder
          await api.post("usuarios/registrar/", { name, email, password, role });

          // Authenticate immediately to grab token context
          const authRes = await api.post("autenticacao/", { username: email, password });
          localStorage.setItem("axis_access_token", authRes.data.access);
          localStorage.setItem("axis_refresh_token", authRes.data.refresh);

          // Pipe compliance payloads down the multi-step onboarding endpoint
          await api.post("lojista/registrar/", {
            name: storeName,
            slug: storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: "Ateliê de Alta Perfumaria cadastrado via portal de onboarding."
          });
        } else {
          // Client account node provisioning pipeline
          await api.post("usuarios/registrar/", { name, email, password, role });

          const authRes = await api.post("autenticacao/", { username: email, password });
          localStorage.setItem("axis_access_token", authRes.data.access);
          localStorage.setItem("axis_refresh_token", authRes.data.refresh);
        }

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Authentication compilation fault:", err);
      if (err.response && err.response.data && err.response.data.erro) {
        setApiError(err.response.data.erro);
      } else if (err.response && err.response.data && err.response.data.detail) {
        setApiError("Credenciais inválidas. Verifique os dados inseridos.");
      } else {
        setApiError("Falha de conexão com o servidor Axis. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#1A1814",
    border: "1px solid rgba(242, 237, 228, 0.4)", // Borda mais forte
    color: "#F2EDE4",
    padding: "13px 16px",
    fontSize: "16px", // Aumentado para 16px
    fontFamily: "'Jost', sans-serif",
    fontWeight: 500, // Mais grosso
    outline: "none",
    borderRadius: "0px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(12, 11, 9, 0.92)" }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-w-[540px] max-h-[calc(100vh-3rem)] border border-white/5 shadow-2xl overflow-y-auto"
              style={{
                backgroundColor: "#0C0B09",
                borderRadius: "0px",
                scrollbarWidth: "none",
              }}
            >
              <style>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-[#A39683] hover:text-[#F2EDE4] transition-colors p-1 z-10 bg-transparent border-none cursor-pointer"
                disabled={loading}
              >
                <X size={20} strokeWidth={1.5} />
              </button>

              <div className="px-6 py-6 md:px-8">
                {/* Checkout Indicator */}
                {isCheckout && (
                  <div
                    className="mb-6 px-5 py-3.5 border-l-2"
                    style={{ borderColor: "#E5C995", backgroundColor: "rgba(229, 201, 149, 0.05)" }}
                  >
                    <p
                      className="text-[13px] tracking-[0.15em] uppercase mb-1 font-medium"
                      style={{ color: "#E5C995", fontFamily: "'Jost', sans-serif" }}
                    >
                      Para finalizar sua compra
                    </p>
                    <p style={{ color: "#A39683", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "14px" }}>
                      Faça login ou crie sua conta para acessar o checkout seguro.
                    </p>
                  </div>
                )}

                {/* Brand Logo Header */}
                <div className="mb-8 text-center">
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 500,
                      fontSize: "2rem",
                      letterSpacing: "0.22em",
                      color: "#F2EDE4",
                    }}
                  >
                    ScentHub
                  </span>
                </div>

                {/* Tab Navigation selectors */}
                <div className="flex border-b border-white/5 mb-6">
                  {(["login", "register"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={loading}
                      onClick={() => { setView(v); setApiError(null); }}
                      className="flex-1 pb-3.5 text-[12px] tracking-[0.2em] uppercase transition-all duration-300 font-bold bg-transparent border-none cursor-pointer"
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        color: view === v ? "#E5C995" : "#A39683",
                        borderBottom: view === v ? "2px solid #E5C995" : "none",
                        marginBottom: view === v ? "-2px" : 0,
                      }}
                    >
                      {v === "login" ? "Entrar" : "Criar Conta"}
                    </button>
                  ))}
                </div>

                {/* Role Selector Chassi */}
                {view === "register" && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setRole("client")}
                      className="flex items-center justify-center gap-2.5 py-3 text-[11px] tracking-widest uppercase border transition duration-300 font-bold cursor-pointer"
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        borderColor: role === "client" ? "#E5C995" : "rgba(242, 237, 228, 0.08)",
                        color: role === "client" ? "#E5C995" : "#A39683",
                        backgroundColor: role === "client" ? "rgba(229, 201, 149, 0.05)" : "transparent",
                        borderRadius: "0px"
                      }}
                    >
                      <User size={14} strokeWidth={1.5} />
                      Cliente
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setRole("merchant")}
                      className="flex items-center justify-center gap-2.5 py-3 text-[11px] tracking-widest uppercase border transition duration-300 font-bold cursor-pointer"
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        borderColor: role === "merchant" ? "#E5C995" : "rgba(242, 237, 228, 0.08)",
                        color: role === "merchant" ? "#E5C995" : "#A39683",
                        backgroundColor: role === "merchant" ? "rgba(229, 201, 149, 0.05)" : "transparent",
                        borderRadius: "0px"
                      }}
                    >
                      <Shield size={14} strokeWidth={1.5} />
                      Lojista
                    </button>
                  </div>
                )}

                {/* API Validation Feedback Template */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-5 p-3.5 text-[13px] font-medium tracking-wide text-red-400 border border-red-900/40 bg-red-950/20 text-center"
                    style={{ fontFamily: "'Jost', sans-serif", borderRadius: "0px" }}
                  >
                    {apiError}
                  </motion.div>
                )}

                {/* Form Inputs (Vertical Stack for maximum linearity) */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-4">
                  {/* Nome da Loja - Apenas Registro de Lojista */}
                  {view === "register" && role === "merchant" && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <label className="block text-[12px] tracking-[0.1em] uppercase mb-1 font-bold text-[#F2EDE4] font-mono">Nome da Loja</label>
                      <input type="text" required disabled={loading} value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Loja Imperial" style={inputStyle} />
                    </motion.div>
                  )}

                  {/* Nome e E-mail (Lado a lado no registro) */}
                  {view === "register" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] tracking-[0.1em] uppercase mb-1 font-bold text-[#F2EDE4] font-mono">Nome do Usuário</label>
                        <input type="text" required disabled={loading} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-[12px] tracking-[0.1em] uppercase mb-1 font-bold text-[#F2EDE4] font-mono">E-mail</label>
                        <input type="email" required disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle} />
                      </div>
                    </div>
                  ) : (
                    /* Apenas E-mail no Login (Full width) */
                    <div>
                      <label className="block text-[14px] tracking-[0.1em] uppercase mb-2 font-bold text-[#F2EDE4] font-mono">E-mail ou Usuário</label>
                      <input type="text" required disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com ou nome" style={inputStyle} />
                    </div>
                  )}

                  {/* Senha e Confirmar Senha (Lado a lado no registro) */}
                  <div className={view === "register" ? "grid grid-cols-2 gap-3" : ""}>
                    <div>
                      <label className="block text-[12px] tracking-[0.1em] uppercase mb-1 font-bold text-[#F2EDE4] font-mono">Senha</label>
                      <div className="relative">
                        <input type={showPass ? "text" : "password"} required disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "45px" }} />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A39683] bg-transparent border-none cursor-pointer">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {view === "register" && (
                      <div>
                        <label className="block text-[12px] tracking-[0.1em] uppercase mb-1 font-bold text-[#F2EDE4] font-mono">Confirmar</label>
                        <div className="relative">
                          <input type={showPass ? "text" : "password"} required disabled={loading} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "45px" }} />
                          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A39683] bg-transparent border-none cursor-pointer">
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Esqueci a Senha (Login) */}
                  {view === "login" && (
                    <div className="text-right">
                      <a href="#" className="inline-block text-[13px] tracking-wide transition-colors duration-200 font-medium underline underline-offset-4 text-[#A39683] hover:text-[#E5C995]" style={{ fontFamily: "'Jost', sans-serif" }}>
                        Esqueceu sua senha?
                      </a>
                    </div>
                  )}

                  {/* Botão */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 text-[12px] tracking-[0.25em] uppercase transition-all duration-300 font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border border-[#E5C995] cursor-pointer"
                      style={{
                        backgroundColor: "#1A1814", // Fundo Escuro (mesmo tom do input)
                        color: "#E5C995",           // Texto Dourado (Axis Style)
                        fontFamily: "'Jost', sans-serif",
                        borderRadius: "0px",
                        fontWeight: 700,
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5C995";
                          (e.currentTarget as HTMLButtonElement).style.color = "#000000";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1814";
                          (e.currentTarget as HTMLButtonElement).style.color = "#E5C995";
                        }
                      }}
                    >
                      {loading ? (
                        <span className="animate-pulse">Processando...</span>
                      ) : view === "login" ? (
                        isCheckout ? "Entrar & Finalizar" : "Entrar"
                      ) : (
                        isCheckout ? "Criar Conta & Finalizar" : "Criar Conta"
                      )}
                    </button>
                  </div>
                </form>

                {/* Footnote Controllers */}
                <p
                  className="text-center text-[14px] mt-6 font-normal tracking-wide"
                  style={{ color: "#A39683", fontFamily: "'Jost', sans-serif" }}
                >
                  {view === "login" ? "Não tem conta? " : "Já tem conta? "}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { setView(view === "login" ? "register" : "login"); setApiError(null); }}
                    className="transition-colors duration-200 font-bold underline underline-offset-4 ml-1 disabled:opacity-50 bg-transparent border-none cursor-pointer text-[#E5C995]"
                  >
                    {view === "login" ? "Criar gratuitamente" : "Fazer login"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}