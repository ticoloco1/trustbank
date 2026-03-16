import Link from "next/link";

export const metadata = {
  title: "Entrar com Google - TrustBank",
  description: "Login com Google para vídeos, paywall e conteúdo. Admin pelo Dashboard (carteira).",
};

export default function AuthPage() {
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
          Entrar com Google
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af", textAlign: "center", marginBottom: "1.25rem" }}>
          Vídeos, paywall e conteúdo. Uma conta, sem senha.
        </p>

        <a
          href="/api/auth/google"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "14px 18px",
            marginBottom: "0.75rem",
            background: "#fff",
            color: "#1f2937",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com Google
        </a>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
          <p style={{ fontSize: 11, color: "#93c5fd", marginBottom: "0.5rem", fontWeight: 600 }}>Admin (painel)</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: "0.75rem" }}>
            Acesso admin é só por <strong>carteira</strong>. Conecte no Dashboard.
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
        <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>← Voltar</Link>
      </p>
    </main>
  );
}
