import Link from "next/link";

export const metadata = {
  title: "How It Works — TrustBank",
  description: "Quatro passos para ser encontrado. Search your slug, build your mini-site, appear in the directory, boost your position.",
};

const STEPS = [
  {
    num: "01",
    title: "Search Your Slug",
    titlePt: "Busque seu Slug",
    en: "Type the keyword you want. If it's free, it's yours. If taken, bid in the marketplace.",
    pt: "Digite a palavra que deseja. Se estiver livre, é sua. Se ocupada, lance no marketplace.",
  },
  {
    num: "02",
    title: "Build Your Mini-Site",
    titlePt: "Construa seu Mini-Site",
    en: "Fill in your profile, add content, connect YouTube, enable paywall, set SEO keywords.",
    pt: "Preencha seu perfil, adicione conteúdo, conecte YouTube, ative paywall e SEO.",
  },
  {
    num: "03",
    title: "Appear in Directory",
    titlePt: "Apareça no Diretório",
    en: "Your mini-site goes live in your category — searched, trusted, and Google-indexed from day one.",
    pt: "Seu mini-site vai ao ar na sua categoria — indexado no Google desde o primeiro dia.",
  },
  {
    num: "04",
    title: "Boost Your Position",
    titlePt: "Impulsione sua Posição",
    en: "Pay to climb the rankings. Reach the homepage spotlight for maximum global visibility.",
    pt: "Pague para subir no ranking. Alcance o destaque na homepage para visibilidade global.",
  },
];

export default function HowItWorksPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>HOW IT WORKS</p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Four steps to <span style={{ color: "#2dd4bf" }}>being found.</span>
        </h1>
        <p style={{ fontSize: "1rem", color: "#94a3b8", marginBottom: "3rem" }}>
          Quatro passos para ser encontrado. / Four steps to being found.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          {STEPS.map((step) => (
            <div key={step.num} style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid #334155" }}>
              <span style={{ display: "inline-block", width: 40, height: 40, lineHeight: "40px", textAlign: "center", background: "#2dd4bf", color: "#0f172a", borderRadius: 8, fontWeight: 700, marginBottom: "0.75rem" }}>{step.num}</span>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.35rem" }}>{step.title}</h2>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.5rem" }}>{step.titlePt}</p>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#cbd5e1", marginBottom: "0.5rem" }}>{step.en}</p>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "#94a3b8" }}>{step.pt}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-block", padding: "0.75rem 1.5rem", background: "#f97316", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}>Começar</Link>
        </div>
      </div>
    </main>
  );
}
