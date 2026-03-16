"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ color: "#b91c1c" }}>Erro nesta página</h2>
      <p style={{ marginBottom: "1rem", color: "#64748b" }}>{error.message}</p>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        <a href="/api/health" style={{ color: "#0d9488" }}>Verificar /api/health</a>
        {" · "}
        <a href="/" style={{ color: "#0d9488" }}>Voltar à home</a>
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
        }}
      >
        Tentar de novo
      </button>
    </main>
  );
}
