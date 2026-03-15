import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <h1>TrustBank</h1>
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
