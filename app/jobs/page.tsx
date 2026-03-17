import Link from "next/link";

export const metadata = {
  title: "Jobs — TrustBank",
  description: "Vagas e oportunidades. Mini-sites com CV e contato protegido.",
};

export default function JobsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Jobs</h1>
        <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
          Vagas e candidatos com mini-sites TrustBank. CV com contato protegido — empresas desbloqueiam por créditos.
        </p>
        <Link href="/dashboard" style={{ display: "inline-block", padding: "0.75rem 1.5rem", background: "#f97316", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}>Criar meu mini site</Link>
        <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#64748b" }}>
          <Link href="/" style={{ color: "#94a3b8" }}>← Voltar</Link>
        </p>
      </div>
    </main>
  );
}
