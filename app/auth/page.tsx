"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab"); // register | null (login)
  const isRegister = tab === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    if (isRegister && password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const url = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erro ao processar.");
        return;
      }
      if (isRegister) setSuccess("Conta criada. Redirecionando…");
      else setSuccess("Entrando…");
      window.location.href = "/dashboard";
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(180deg, #0a0e17 0%, #111827 100%)",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 16,
          padding: "2rem",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: "1.5rem", fontWeight: 700 }}>
            TrustBank
          </Link>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem", letterSpacing: "0.05em" }}>
            PREMIUM VIDEO EXCHANGE
          </p>
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" }}>
          {isRegister ? "Criar conta" : "Entrar"}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af", textAlign: "center", marginBottom: "1.25rem" }}>
          {isRegister ? "E-mail e senha. Depois você pode conectar a carteira no Dashboard." : "Use seu e-mail e senha."}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{
              width: "100%",
              padding: "12px 14px",
              marginBottom: "0.75rem",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "#fff",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            style={{
              width: "100%",
              padding: "12px 14px",
              marginBottom: "0.75rem",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "#fff",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
          {error && <p style={{ color: "#f87171", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{error}</p>}
          {success && <p style={{ color: "#86efac", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 18px",
              background: "#1e3a8a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Aguarde…" : isRegister ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "#9ca3af" }}>
          {isRegister ? (
            <>
              Já tem conta?{" "}
              <Link href="/auth" style={{ color: "#93c5fd", textDecoration: "none" }}>
                Entrar
              </Link>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <Link href="/auth?tab=register" style={{ color: "#93c5fd", textDecoration: "none" }}>
                Criar conta
              </Link>
            </>
          )}
        </p>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem", marginTop: "1rem" }}>
          <p style={{ fontSize: 11, color: "#93c5fd", marginBottom: "0.5rem", fontWeight: 600 }}>Wallet</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: "0.75rem" }}>
            Você pode conectar a carteira no site (botão &quot;Connect Wallet&quot;) para admin e pagamentos. O login por e-mail/senha é para vídeos e painel.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px 16px",
              background: "rgba(59, 130, 246, 0.2)",
              color: "#93c5fd",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid rgba(59, 130, 246, 0.4)",
            }}
          >
            Dashboard → conectar carteira
          </Link>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem", marginTop: "1rem" }}>
          <p style={{ fontSize: 11, color: "#6b7280", textAlign: "center", margin: 0 }}>
            TRUSTBANK IS A TECH PLATFORM. CONTENT IS CREATOR RESPONSIBILITY. HIGH RISK ASSET.
          </p>
        </div>
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: 14 }}>
        <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>
          ← Voltar
        </Link>
      </p>
    </main>
  );
}
