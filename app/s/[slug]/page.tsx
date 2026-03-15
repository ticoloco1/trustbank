import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { CotacaoBlock } from "./CotacaoBlock";
import InvestorTemplate from "./InvestorTemplate";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export default async function MiniSitePage({ params }: Props) {
  const { slug } = await params;
  const prisma = getPrisma();
  if (!prisma) notFound();

  const site = await prisma.miniSite.findUnique({
    where: { slug },
    include: { ideas: { orderBy: { created_at: "desc" } } },
  });
  if (!site) notFound();

  if (site.template === "investor") {
    return (
      <InvestorTemplate
        site={{
          site_name: site.site_name,
          slug: site.slug,
          bio: site.bio,
          primary_color: site.primary_color,
          accent_color: site.accent_color,
          bg_color: site.bg_color,
          ideas: site.ideas,
        }}
      />
    );
  }

  const cols = site.layout_columns ?? 1;
  const layoutClass = `minisite-layout-${cols}` as "minisite-layout-1" | "minisite-layout-2" | "minisite-layout-3";
  const primary = site.primary_color ?? "#6366f1";
  const accent = site.accent_color ?? "#ec4899";
  const bg = site.bg_color ?? "#f8fafc";

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        background: bg,
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: primary, textDecoration: "none", fontSize: "0.9rem" }}>
            ← TrustBank
          </Link>
        </div>

        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: 0, color: primary }}>
            {site.site_name || "Mini Site"}
          </h1>
          {site.bio && (
            <p style={{ color: "#555", marginTop: "0.5rem", lineHeight: 1.5 }}>
              {site.bio}
            </p>
          )}
        </header>

        <div className={layoutClass}>
          {/* 1 coluna: tudo em bloco; 2 e 3 colunas: células fixas para o grid */}
          {cols === 1 && (
            <>
              {(site.cotacao_symbol || site.cotacao_label) && (
                <section style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1rem", color: accent, marginBottom: "0.5rem" }}>Cotação</h2>
                  <CotacaoBlock symbol={site.cotacao_symbol} label={site.cotacao_label} />
                </section>
              )}
              {site.ideas && site.ideas.length > 0 && (
                <section>
                  <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Ideias</h2>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {site.ideas.map((idea) => (
                      <li
                        key={idea.id}
                        style={{
                          padding: "1rem",
                          marginBottom: "0.75rem",
                          background: "rgba(255,255,255,0.6)",
                          borderRadius: 8,
                          borderLeft: `4px solid ${accent}`,
                        }}
                      >
                        {idea.title && (
                          <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>
                        )}
                        {idea.content && (
                          <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
          {cols === 2 && (
            <>
              <div>
                {(site.cotacao_symbol || site.cotacao_label) && (
                  <section style={{ marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1rem", color: accent, marginBottom: "0.5rem" }}>Cotação</h2>
                    <CotacaoBlock symbol={site.cotacao_symbol} label={site.cotacao_label} />
                  </section>
                )}
              </div>
              <div>
                {site.ideas && site.ideas.length > 0 && (
                  <section>
                    <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Ideias</h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {site.ideas.map((idea) => (
                        <li
                          key={idea.id}
                          style={{
                            padding: "1rem",
                            marginBottom: "0.75rem",
                            background: "rgba(255,255,255,0.6)",
                            borderRadius: 8,
                            borderLeft: `4px solid ${accent}`,
                          }}
                        >
                          {idea.title && (
                            <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>
                          )}
                          {idea.content && (
                            <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}
          {cols === 3 && (
            <>
              <div>
                {(site.cotacao_symbol || site.cotacao_label) && (
                  <section style={{ marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1rem", color: accent, marginBottom: "0.5rem" }}>Cotação</h2>
                    <CotacaoBlock symbol={site.cotacao_symbol} label={site.cotacao_label} />
                  </section>
                )}
              </div>
              <div>
                {site.ideas && site.ideas.length > 0 && (
                  <section>
                    <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Ideias</h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {site.ideas.map((idea) => (
                        <li
                          key={idea.id}
                          style={{
                            padding: "1rem",
                            marginBottom: "0.75rem",
                            background: "rgba(255,255,255,0.6)",
                            borderRadius: 8,
                            borderLeft: `4px solid ${accent}`,
                          }}
                        >
                          {idea.title && (
                            <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>
                          )}
                          {idea.content && (
                            <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
              <div />
            </>
          )}
        </div>

        <section
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "rgba(0,0,0,0.04)",
            borderRadius: 8,
            borderLeft: `4px solid ${accent}`,
          }}
        >
          <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem", color: primary }}>Slug marketplace</h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
            Buy or auction company slugs and @handles. List this mini-site or reserve a name.
          </p>
          <Link
            href="/market"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              color: accent,
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Browse marketplace →
          </Link>
        </section>
      </div>
    </main>
  );
}
