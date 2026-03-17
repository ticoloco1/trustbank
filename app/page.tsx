import Link from "next/link";
import HomeSlugCheck from "./components/HomeSlugCheck";
import HealthBanner from "./components/HealthBanner";

export const metadata = {
  title: "TrustBank — One keyword. Infinite authority.",
  description: "Claim your slug. Build your mini-site. Bio, videos, paywall, CV, links — one premium address. Indexed on Google from day one.",
};

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem 1rem 3rem",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <HealthBanner />

        <section style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>WHY TRUSTBANK</p>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "0.5rem" }}>
            One keyword. <span style={{ color: "#f97316" }}>Infinite authority.</span>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
            Uma palavra-chave. Autoridade infinita. / One keyword. Infinite authority.
          </p>
        </section>

        <section style={{ marginBottom: "3rem" }}>
          <HomeSlugCheck />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid #334155" }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #fbbf24, #f59e0b)", borderRadius: 12, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🔑</div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.35rem" }}>Exclusive Ownership</h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Propriedade Exclusiva</p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "#cbd5e1", marginBottom: "1rem" }}>
              No two people share the same slug. Your keyword is locked to you — as long as your plan is active. Let it go, and it&apos;s available again.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, marginBottom: "1rem" }}>
              Ninguém compartilha o mesmo slug. Sua palavra está bloqueada para você enquanto o plano estiver ativo.
            </p>
            <Link href="/slugs" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "#22c55e", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>ONE OF A KIND</Link>
          </div>

          <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid #334155" }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #3b82f6, #2563eb)", borderRadius: 12, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🌐</div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.35rem" }}>Luxury Mini-Site</h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Mini-Site Premium</p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "#cbd5e1", marginBottom: "1rem" }}>
              Bio, videos, paywall, AI assistant, CV, links, map, contact form — all at one premium address. Indexed on Google from day one.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, marginBottom: "1rem" }}>
              Bio, vídeos, paywall, CV, links, mapa, formulário — tudo em um endereço premium. Indexado no Google desde o primeiro dia.
            </p>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "#f97316", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>FULL PROFILE</Link>
          </div>

          <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid #334155" }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", borderRadius: 12, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🚀</div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.35rem" }}>Rise in Rankings</h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Suba no Ranking</p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "#cbd5e1", marginBottom: "1rem" }}>
              Boost your position inside the directory. Every $1.50 climbs one spot. The top puts you in front of every visitor — worldwide.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, marginBottom: "1rem" }}>
              Impulsione sua posição no diretório. O topo coloca você na frente de cada visitante — no mundo todo.
            </p>
            <Link href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "#22c55e", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>BOOST SYSTEM</Link>
          </div>
        </section>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>
          <Link href="/market" style={{ color: "#94a3b8" }}>Marketplace</Link>
          {" · "}
          <Link href="/slugs" style={{ color: "#94a3b8" }}>Slugs</Link>
          {" · "}
          <Link href="/dashboard" style={{ color: "#94a3b8" }}>Mini Site</Link>
        </p>
      </div>
    </main>
  );
}
