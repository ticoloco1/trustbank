import Link from "next/link";

export const metadata = {
  title: "Mini Site - TrustBank",
  description: "Create and manage your mini site.",
};

export default function MiniSiteLandingPage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        padding: "2rem 1rem",
        maxWidth: 640,
        margin: "0 auto",
        background: "#f8fafc",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.9rem" }}>
          ← TrustBank
        </Link>
      </div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Mini Site</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Create your page at trustbank.xyz/s/your-slug. Claim a slug or create a mini site from the dashboard.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Link
          href="/dashboard"
          style={{
            display: "block",
            padding: "14px 18px",
            background: "#0f172a",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Dashboard — Create & edit mini sites
        </Link>
        <Link
          href="/slugs"
          style={{
            display: "block",
            padding: "14px 18px",
            background: "#0d9488",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Claim a slug ($12.90)
        </Link>
        <Link
          href="/market"
          style={{
            display: "block",
            padding: "14px 18px",
            background: "#1e40af",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Slug marketplace
        </Link>
      </div>
    </main>
  );
}
