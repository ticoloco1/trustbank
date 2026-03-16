import Link from "next/link";

export const metadata = {
  title: "Governance - TrustBank",
  description: "Admin and company slugs. List @handles for sale or auction from the Dashboard.",
};

export default function GovernancePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        padding: "2rem 1rem",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.9rem" }}>
          ← TrustBank
        </Link>
      </div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Governance</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Admin settings and company slugs (@) are managed from the Dashboard. Connect your wallet (admin) to manage API keys and list slugs.
      </p>
      <section
        style={{
          padding: "1.25rem",
          background: "#f0fdfa",
          borderRadius: 8,
          border: "1px solid #99f6e4",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#0f766e" }}>
          Company Slugs (@)
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#134e4a", marginBottom: "0.75rem" }}>
          To <strong>sell, auction, or transfer</strong> premium slugs (e.g. <code>@apple</code>, <code>@properties</code>):
        </p>
        <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "#134e4a", fontSize: "0.9rem", lineHeight: 1.7 }}>
          <li>Go to the <strong>Dashboard</strong> and connect your wallet.</li>
          <li>Use the section <strong>&quot;List company / @handle&quot;</strong>.</li>
          <li>Enter the slug (e.g. <code>properties</code> or <code>@properties</code>), choose <strong>@handle</strong> or <strong>/company</strong>, set price, and choose <strong>Sale</strong> or <strong>Auction</strong>.</li>
          <li>Click <strong>List on marketplace</strong>. The slug will appear on the marketplace for others to buy or bid.</li>
        </ol>
      </section>
      <Link
        href="/dashboard"
        style={{
          display: "inline-block",
          padding: "12px 20px",
          background: "#0d9488",
          color: "#fff",
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Open Dashboard
      </Link>
    </main>
  );
}
