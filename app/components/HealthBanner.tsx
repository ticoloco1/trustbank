"use client";

import { useEffect, useState } from "react";

type Health = { ok?: boolean; prisma?: boolean; expectPrisma?: boolean; message?: string } | null;

export default function HealthBanner() {
  const [health, setHealth] = useState<Health>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: Health) => setHealth(data))
      .catch(() => setHealth({ ok: false, prisma: false, expectPrisma: false }));
  }, []);

  if (!health || health.prisma) return null;
  if (health.expectPrisma === false) return null;

  return (
    <div
      role="alert"
      style={{
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        background: "#7f1d1d",
        color: "#fecaca",
        borderRadius: 12,
        border: "2px solid #b91c1c",
        fontSize: "0.95rem",
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.35rem" }}>
        Site sem banco de dados
      </strong>
      <p style={{ margin: 0 }}>
        Pesquisa, login e mini-sites não funcionam até você configurar{" "}
        <strong>DATABASE_URL</strong> no Vercel (Settings → Environment Variables) e fazer redeploy.
        Depois confira: <a href="/api/health" style={{ color: "#fef08a" }}>/api/health</a> deve mostrar <code style={{ background: "#991b1b", padding: "2px 6px", borderRadius: 4 }}>prisma: true</code>.
      </p>
    </div>
  );
}
