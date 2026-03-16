import Link from "next/link";
import HomeSlugCheck from "./components/HomeSlugCheck";
import HealthBanner from "./components/HealthBanner";

export default function Home() {
  return (
    <main style={{ padding: "2rem 1rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <HealthBanner />
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem" }}>TrustBank</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
        Compre domínios/slugs para sua página. Busque quantos quiser, adicione ao carrinho e pague de uma vez.
      </p>
      <HomeSlugCheck />

      <p style={{ color: "#64748b", marginBottom: "1rem", fontSize: "0.9rem" }}>
        Quer comprar vários? Busque um nome, clique em &quot;Só adicionar ao carrinho&quot;, busque o próximo e repita. Depois abra o <Link href="/cart" style={{ color: "#0d9488", fontWeight: 700 }}>Carrinho</Link> no topo da página e pague todos juntos.
      </p>
      <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/cart" style={{ padding: "0.5rem 1rem", background: "#16a34a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
          Carrinho
        </Link>
        <Link href="/slugs" style={{ padding: "0.5rem 1rem", background: "#1e3a8a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
          Buscar mais domínios
        </Link>
        <Link href="/dashboard" style={{ padding: "0.5rem 1rem", background: "#334155", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link href="/market" style={{ padding: "0.5rem 1rem", background: "#475569", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
          Marketplace
        </Link>
        <Link href="/governance" style={{ padding: "0.5rem 1rem", background: "#713f12", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
          Governance
        </Link>
      </nav>
    </main>
  );
}
