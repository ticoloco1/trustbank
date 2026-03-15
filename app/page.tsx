import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>TrustBank</h1>
        <Link
          href="/auth"
          style={{
            padding: "0.5rem 1rem",
            background: "#1e40af",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Sign In
        </Link>
      </header>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        APIs: /api/auth/me, /api/settings, /api/mini-sites, /api/slugs, /api/ideas.
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
          Dashboard / Mini sites
        </Link>
        <Link
          href="/market"
          style={{
            padding: "0.5rem 1rem",
            background: "#1e3a5f",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Slug marketplace
        </Link>
        <Link href="/api/mini-sites" style={{ color: "#0066cc" }}>
          Mini sites (API)
        </Link>
      </nav>
    </main>
  );
}
