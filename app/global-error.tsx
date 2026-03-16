"use client";

/**
 * Se algo quebrar no root layout (Providers, etc.), esta página aparece em vez de tela em branco.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 600, margin: "0 auto", background: "#0f172a", color: "#e2e8f0" }}>
        <h1 style={{ color: "#fca5a5" }}>Algo deu errado</h1>
        <p style={{ marginBottom: "1rem" }}>
          O site encontrou um erro. Isso pode ser configuração no Vercel (variáveis de ambiente) ou um bug.
        </p>
        <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#94a3b8" }}>
          Confira: <a href="/api/health" style={{ color: "#38bdf8" }}>/api/health</a> — deve mostrar <code style={{ background: "#1e293b", padding: "2px 6px" }}>prisma: true</code>.
        </p>
        <p style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#64748b" }}>
          {error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            background: "#1e3a8a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
