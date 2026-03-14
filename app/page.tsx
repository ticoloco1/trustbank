import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <h1>TrustBank</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        API disponível em /api/auth/me, /api/settings, /api/mini-sites e /api/ideas.
      </p>
      <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/dashboard"
          style={{
            padding: "0.5rem 1rem",
            background: "#333",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Governance / Mini sites
        </Link>
        <Link href="/api/mini-sites" style={{ color: "#0066cc" }}>
          Ver lista de mini sites (API)
        </Link>
      </nav>
    </main>
  );
}
