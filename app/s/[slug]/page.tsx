import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { CotacaoBlock } from "./CotacaoBlock";
import InvestorTemplate from "./InvestorTemplate";
import PremiumTemplate from "./PremiumTemplate";
import PremiumDarkTemplate from "./PremiumDarkTemplate";
import PremiumFintechTemplate from "./PremiumFintechTemplate";
import ProfileTemplate from "./ProfileTemplate";
import NetflixTemplate from "./NetflixTemplate";
import CVProTemplate from "./CVProTemplate";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";
import AnalyticsTracker from "./AnalyticsTracker";
import SafeImage from "./SafeImage";
import MiniSiteVideosSection from "./MiniSiteVideosSection";
import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

/** URL canônica do mini site: só /@ (ex.: trustbank.xyz/@ary). */
function canonicalMinisiteUrl(slug: string): string {
  const norm = (slug || "").replace(/^@/, "");
  return norm ? `${BASE_URL}/@${norm}` : BASE_URL;
}

type SiteWithRelations = Prisma.MiniSiteGetPayload<{
  include: {
    ideas: true;
    listed_domains: true;
    extra_pages: true;
    mini_site_videos: { include: { video: { include: { quotation: true } } } };
  };
}>;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const prisma = getPrisma();
    if (!prisma) return { title: `${slug} | TrustBank` };

    const slugNorm = slug.replace(/^@/, "").toLowerCase();
    const site = await prisma.miniSite.findFirst({
    where: { OR: [{ slug }, { slug: slugNorm }, { slug: `@${slugNorm}` }] },
    select: {
      site_name: true,
      slug: true,
      bio: true,
      banner_url: true,
      feed_image_1: true,
      ideas: { orderBy: { created_at: "desc" }, take: 5, select: { title: true } },
    },
  });

  const canonicalSlug = slug.startsWith("@") ? slug : (site?.slug ?? slug);
  const url = canonicalMinisiteUrl(canonicalSlug);

  if (!site) {
    return {
      title: `${slug} | TrustBank`,
      description: `Página ${slug} no TrustBank. Registre ou compre este slug.`,
      openGraph: { title: `${slug} | TrustBank`, url },
      alternates: { canonical: url },
    };
  }

  const name = site.site_name || site.slug?.replace(/^@/, "") || slug;
  const title = `${name} | TrustBank`;
  const description =
    site.bio?.slice(0, 160) ||
    (site.ideas?.length
      ? `Conteúdo e publicações de ${name}.`
      : `${name} no TrustBank — mini site, vídeos e ativos digitais.`);
  const keywords = [
    name,
    site.slug?.replace(/^@/, ""),
    "TrustBank",
    "mini site",
    ...(site.ideas?.slice(0, 3).map((i) => i.title).filter(Boolean) as string[]),
  ].filter(Boolean) as string[];

  const ogImage =
    site.banner_url || site.feed_image_1 || `${BASE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: "TrustBank",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
  } catch {
    const { slug } = await params;
    return {
      title: `${slug} | TrustBank`,
      description: "Mini site no TrustBank.",
      openGraph: { title: `${slug} | TrustBank`, url: canonicalMinisiteUrl(slug) },
    };
  }
}

export default async function MiniSitePage({ params }: Props) {
  let slug: string;
  try {
    const p = await params;
    slug = p.slug;
  } catch {
    notFound();
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>trustbank.xyz/@{slug.replace(/^@/, "")}</h1>
        <p style={{ color: "#64748b", marginBottom: "1rem" }}>Banco de dados não configurado. Configure DATABASE_URL na Vercel (Settings → Environment Variables).</p>
        <Link href="/" style={{ color: "#0d9488", fontWeight: 600 }}>← Voltar à home</Link>
      </main>
    );
  }

  let site: SiteWithRelations | null;
  try {
    const slugNorm = slug.replace(/^@/, "").toLowerCase();
    site = await prisma.miniSite.findFirst({
    where: { OR: [{ slug }, { slug: slugNorm }, { slug: `@${slugNorm}` }] },
    include: {
      ideas: { orderBy: { created_at: "desc" } },
      listed_domains: { orderBy: [{ sort_order: "asc" }, { created_at: "asc" }] },
      extra_pages: { orderBy: { sort_order: "asc" } },
      mini_site_videos: {
        orderBy: { sort_order: "asc" },
        include: { video: { include: { quotation: true } } },
      },
    },
  });
  } catch (err) {
    console.error("[s/[slug]]", err);
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Erro ao carregar trustbank.xyz/@{slug.replace(/^@/, "")}</h1>
        <p style={{ color: "#64748b", marginBottom: "1rem" }}>Falha ao conectar ao banco ou tabelas faltando. Verifique DATABASE_URL na Vercel (Settings → Environment Variables). No seu PC, com DATABASE_URL do produção no .env.local, rode: <code style={{ background: "#f1f5f9", padding: "0.2em 0.4em", borderRadius: 4 }}>npm run db:push</code> para criar/atualizar as tabelas.</p>
        <Link href="/" style={{ color: "#0d9488", fontWeight: 600 }}>← Voltar à home</Link>
      </main>
    );
  }

  if (!site) {
    const slugNorm = slug.replace(/^@/, "") || slug;
    const listing = await prisma.slugListing.findFirst({
      where: {
        status: "active",
        OR: [
          { slug_value: slug },
          { slug_value: slugNorm },
          { slug_value: `@${slugNorm}` },
        ],
      },
    });
    const otherSlug = slug.startsWith("@") ? slugNorm : `@${slugNorm}`;
    const takenByOther = await prisma.miniSite.findFirst({
      where: { slug: otherSlug },
    });
    const available = !takenByOther && !listing && /^[a-z0-9@_-]+$/i.test(slugNorm);
    const displaySlug = (slug || "").replace(/^@/, "");
    return (
      <main style={{ fontFamily: "system-ui", minHeight: "100vh", padding: "2rem", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>trustbank.xyz/@{displaySlug || "..."}</h1>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            {listing
              ? "Este slug está à venda. Compre no marketplace."
              : available
                ? "Este slug está livre. Reivindique para criar sua página."
                : "Esta página ainda não existe."}
          </p>
          {listing && (
            <Link href={`/market/${listing.id}`} style={{ display: "inline-block", padding: "12px 20px", background: "#0d9488", color: "#fff", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
              Buy on marketplace
            </Link>
          )}
          {available && !listing && (
            <Link href={`/slugs?slug=${encodeURIComponent(slugNorm)}`} style={{ display: "inline-block", padding: "12px 20px", background: "#0d9488", color: "#fff", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
              Reivindicar este slug
            </Link>
          )}
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/" style={{ color: "#0d9488", textDecoration: "none" }}>← Home</Link>
            {" · "}
            <Link href="/market" style={{ color: "#0d9488", textDecoration: "none" }}>Marketplace</Link>
          </p>
        </div>
      </main>
    );
  }

  const template = site.template ?? "default";
  if (template === "investor" || template === "domains") {
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <InvestorTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            primary_color: site.primary_color,
            accent_color: site.accent_color,
            bg_color: site.bg_color,
            cotacao_symbol: site.cotacao_symbol,
            cotacao_label: site.cotacao_label,
            ticker_bar_color: (site as { ticker_bar_color?: string | null }).ticker_bar_color,
            banner_url: site.banner_url,
            feed_image_1: site.feed_image_1,
            feed_image_2: site.feed_image_2,
            feed_image_3: site.feed_image_3,
            feed_image_4: site.feed_image_4,
            gallery_images: site.gallery_images as { url: string; caption?: string }[] | null,
            ideas: site.ideas,
            listed_domains: site.listed_domains ?? [],
          }}
        />
      </>
    );
  }

  if (template === "premium") {
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <PremiumTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            primary_color: site.primary_color,
            accent_color: site.accent_color,
            bg_color: site.bg_color,
            banner_url: site.banner_url,
            feed_image_1: site.feed_image_1,
            feed_image_2: site.feed_image_2,
            feed_image_3: site.feed_image_3,
            feed_image_4: site.feed_image_4,
            gallery_images: site.gallery_images as { url: string; caption?: string }[] | null,
            ideas: site.ideas,
            listed_domains: site.listed_domains ?? [],
          }}
        />
      </>
    );
  }

  if (template === "premium_dark") {
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <PremiumDarkTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            primary_color: site.primary_color,
            accent_color: site.accent_color,
            bg_color: site.bg_color,
            banner_url: site.banner_url,
            feed_image_1: site.feed_image_1,
            feed_image_2: site.feed_image_2,
            feed_image_3: site.feed_image_3,
            feed_image_4: site.feed_image_4,
            gallery_images: site.gallery_images as { url: string; caption?: string }[] | null,
            ideas: site.ideas,
            listed_domains: site.listed_domains ?? [],
          }}
        />
      </>
    );
  }

  if (template === "premium_fintech") {
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <PremiumFintechTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            primary_color: site.primary_color,
            accent_color: site.accent_color,
            bg_color: site.bg_color,
            banner_url: site.banner_url,
            feed_image_1: site.feed_image_1,
            feed_image_2: site.feed_image_2,
            feed_image_3: site.feed_image_3,
            feed_image_4: site.feed_image_4,
            gallery_images: site.gallery_images as { url: string; caption?: string }[] | null,
            ideas: site.ideas,
            listed_domains: site.listed_domains ?? [],
          }}
        />
      </>
    );
  }

  if (template === "profile") {
    const s = site as SiteWithRelations & { text_color?: string | null; heading_color?: string | null; font_size_base?: string | null; avatar_size?: string | null; badge_type?: string | null };
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <ProfileTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            primary_color: site.primary_color,
            theme: site.theme,
            feed_image_1: site.feed_image_1,
            ideas: site.ideas,
            text_color: s.text_color,
            heading_color: s.heading_color,
            font_size_base: s.font_size_base,
            avatar_size: s.avatar_size,
            badge_type: s.badge_type,
          }}
        />
      </>
    );
  }

  if (template === "netflix") {
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <NetflixTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            banner_url: site.banner_url,
            mini_site_videos: site.mini_site_videos ?? [],
          }}
        />
      </>
    );
  }

  if (template === "cv_pro") {
    const s = site as SiteWithRelations & { text_color?: string | null; heading_color?: string | null; font_size_base?: string | null; avatar_size?: string | null; badge_type?: string | null };
    return (
      <>
        <AnalyticsTracker miniSiteId={site.id} path="/" />
        <CVProTemplate
          site={{
            site_name: site.site_name,
            slug: site.slug,
            bio: site.bio,
            primary_color: site.primary_color,
            banner_url: site.banner_url,
            feed_image_1: site.feed_image_1,
            extra_pages: site.extra_pages ?? [],
            cv_contact_email: (site as { cv_contact_email?: string | null }).cv_contact_email,
            cv_contact_phone: (site as { cv_contact_phone?: string | null }).cv_contact_phone,
            cv_contact_whatsapp: (site as { cv_contact_whatsapp?: string | null }).cv_contact_whatsapp,
            text_color: s.text_color,
            heading_color: s.heading_color,
            font_size_base: s.font_size_base,
            avatar_size: s.avatar_size,
            badge_type: s.badge_type,
          }}
        />
      </>
    );
  }

  const cols = site.layout_columns ?? 1;
  const layoutClass = `minisite-layout-${cols}` as "minisite-layout-1" | "minisite-layout-2" | "minisite-layout-3";
  const contentOrder = (site as { content_order?: string | null }).content_order;
  const postsFirst = contentOrder === "posts_first";
  const primary = site.primary_color ?? "#6366f1";
  const accent = site.accent_color ?? "#ec4899";
  const bg = site.bg_color ?? "#f8fafc";
  const siteExt = site as SiteWithRelations & { text_color?: string | null; heading_color?: string | null; font_size_base?: string | null; avatar_size?: string | null; badge_type?: string | null };
  const avatarSizes = { P: 64, M: 96, G: 128, GG: 160 } as const;
  const defaultAvatarSize = (siteExt.avatar_size && siteExt.avatar_size in avatarSizes ? avatarSizes[siteExt.avatar_size as keyof typeof avatarSizes] : 96) as number;
  const badgeType = siteExt.badge_type === "blue" || siteExt.badge_type === "gold" ? siteExt.badge_type : null;
  const headingColor = siteExt.heading_color ?? primary;
  const textColor = siteExt.text_color ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: site.site_name || site.slug || slug,
    description: site.bio || undefined,
    url: canonicalMinisiteUrl(site.slug ?? slug),
    publisher: { "@type": "Organization", name: "TrustBank", url: BASE_URL },
    ...(site.ideas?.length
      ? { mainEntity: { "@type": "ItemList", itemListElement: site.ideas.slice(0, 10).map((idea, i) => ({ "@type": "ListItem", position: i + 1, name: idea.title || idea.content?.slice(0, 80) })) } }
      : {}),
  };

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        background: bg,
        padding: "2rem 1rem",
      }}
    >
      <AnalyticsTracker miniSiteId={site.id} path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: primary, textDecoration: "none", fontSize: "0.9rem" }}>
            ← TrustBank
          </Link>
        </div>
        <MiniSiteGoogleBanner slug={site.slug ?? ""} />

        {/* Banner estilo X (capa) + perfil */}
        <header style={{ marginBottom: "2rem", position: "relative" }}>
          {site.banner_url && (
            <div style={{ width: "100%", height: 200, borderRadius: "12px 12px 0 0", overflow: "hidden", background: "#e2e8f0" }}>
              <SafeImage src={site.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ padding: site.banner_url ? "1rem 0 0" : "0", marginTop: site.banner_url ? "-48px" : 0, position: "relative", zIndex: 1, paddingLeft: "0.5rem", color: textColor }}>
            <div style={{ width: defaultAvatarSize, height: defaultAvatarSize, borderRadius: "50%", overflow: "hidden", border: "4px solid", borderColor: bg, background: "#e2e8f0", flexShrink: 0 }}>
              {site.feed_image_1 ? (
                <SafeImage src={site.feed_image_1} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: primary, opacity: 0.3 }} />
              )}
            </div>
            <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0", color: headingColor, display: "flex", alignItems: "center", gap: 6 }}>
              {site.site_name || "Mini Site"}
              {badgeType === "blue" && <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#3b82f6", color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Verificado">✓</span>}
              {badgeType === "gold" && <span style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#fff", fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Empresa">★</span>}
            </h1>
            {site.bio && (
              <p style={{ color: textColor ?? "#555", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {site.bio.replace(/<[^>]+>/g, "")}
              </p>
            )}
          </div>
        </header>

        {([site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean) as string[]).length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", borderRadius: 12, overflow: "hidden" }}>
              {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).map((url, i) => (
                <div key={i} style={{ aspectRatio: "1", background: "#e2e8f0" }}>
                  <SafeImage src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {site.listed_domains && site.listed_domains.filter((d: { status: string }) => d.status === "available").length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Premium Domains</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {site.listed_domains.filter((d: { status: string }) => d.status === "available").map((d: { id: string; name: string; slug: string; price: string | null; link: string | null }) => (
                <div key={d.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.6)", borderRadius: 8, borderLeft: `4px solid ${accent}`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div>
                    <Link href={`/d/${d.slug}`} style={{ fontSize: "1rem", fontWeight: 600, color: primary, textDecoration: "none" }}>{d.name}</Link>
                    {d.price && <span style={{ display: "block", fontSize: "0.9rem", color: "#0d9488", marginTop: 2 }}>${d.price}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {d.link && <a href={d.link} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: accent, color: "#fff", borderRadius: 6, fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>Buy now</a>}
                    <Link href={`/d/${d.slug}`} style={{ padding: "6px 12px", border: `1px solid ${primary}`, color: primary, borderRadius: 6, fontSize: "0.85rem", textDecoration: "none" }}>Make offer / View</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <MiniSiteVideosSection
          miniSiteSlug={site.slug ?? slug}
          primaryColor={site.primary_color}
          clubNftName={(site as { club_nft_name?: string | null }).club_nft_name}
          videos={(site as { mini_site_videos?: { video: { id: string; youtube_id: string; title: string | null; thumbnail_url: string | null; quotation?: { total_shares: number; valuation_usdc: string | null; ticker_symbol: string | null; revenue_usdc: string | null } | null } }[] }).mini_site_videos ?? []}
        />

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
                  <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Posts / Ideias</h2>
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
                        {idea.image_url && (
                          <div style={{ marginBottom: "0.5rem", borderRadius: 8, overflow: "hidden", maxHeight: 320 }}>
                            <SafeImage src={idea.image_url} alt="" style={{ maxWidth: "100%", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} />
                          </div>
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
              {postsFirst ? (
                <>
                  <div>
                    {site.ideas && site.ideas.length > 0 && (
                      <section>
                        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Posts / Ideias</h2>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {site.ideas.map((idea) => (
                            <li key={idea.id} style={{ padding: "1rem", marginBottom: "0.75rem", background: "rgba(255,255,255,0.6)", borderRadius: 8, borderLeft: `4px solid ${accent}` }}>
                              {idea.title && <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>}
                              {idea.image_url && <div style={{ marginBottom: "0.5rem", borderRadius: 8, overflow: "hidden", maxHeight: 320 }}><SafeImage src={idea.image_url} alt="" style={{ maxWidth: "100%", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} /></div>}
                              {idea.content && <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                  <div>
                    {(site.cotacao_symbol || site.cotacao_label) && (
                      <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ fontSize: "1rem", color: accent, marginBottom: "0.5rem" }}>Cotação</h2>
                        <CotacaoBlock symbol={site.cotacao_symbol} label={site.cotacao_label} />
                      </section>
                    )}
                  </div>
                </>
              ) : (
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
                        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Posts / Ideias</h2>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {site.ideas.map((idea) => (
                            <li key={idea.id} style={{ padding: "1rem", marginBottom: "0.75rem", background: "rgba(255,255,255,0.6)", borderRadius: 8, borderLeft: `4px solid ${accent}` }}>
                              {idea.title && <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>}
                              {idea.image_url && <div style={{ marginBottom: "0.5rem", borderRadius: 8, overflow: "hidden", maxHeight: 320 }}><SafeImage src={idea.image_url} alt="" style={{ maxWidth: "100%", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} /></div>}
                              {idea.content && <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          {cols === 3 && (
            <>
              {postsFirst ? (
                <>
                  <div>
                    {site.ideas && site.ideas.length > 0 && (
                      <section>
                        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Posts / Ideias</h2>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {site.ideas.map((idea) => (
                            <li key={idea.id} style={{ padding: "1rem", marginBottom: "0.75rem", background: "rgba(255,255,255,0.6)", borderRadius: 8, borderLeft: `4px solid ${accent}` }}>
                              {idea.title && <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>}
                              {idea.image_url && <div style={{ marginBottom: "0.5rem", borderRadius: 8, overflow: "hidden", maxHeight: 320 }}><SafeImage src={idea.image_url} alt="" style={{ maxWidth: "100%", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} /></div>}
                              {idea.content && <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                  <div>
                    {(site.cotacao_symbol || site.cotacao_label) && (
                      <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ fontSize: "1rem", color: accent, marginBottom: "0.5rem" }}>Cotação</h2>
                        <CotacaoBlock symbol={site.cotacao_symbol} label={site.cotacao_label} />
                      </section>
                    )}
                  </div>
                  <div />
                </>
              ) : (
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
                        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Posts / Ideias</h2>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {site.ideas.map((idea) => (
                            <li key={idea.id} style={{ padding: "1rem", marginBottom: "0.75rem", background: "rgba(255,255,255,0.6)", borderRadius: 8, borderLeft: `4px solid ${accent}` }}>
                              {idea.title && <strong style={{ display: "block", marginBottom: "0.25rem", color: primary }}>{idea.title}</strong>}
                              {idea.image_url && <div style={{ marginBottom: "0.5rem", borderRadius: 8, overflow: "hidden", maxHeight: 320 }}><SafeImage src={idea.image_url} alt="" style={{ maxWidth: "100%", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} /></div>}
                              {idea.content && <p style={{ margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{idea.content}</p>}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                  <div />
                </>
              )}
            </>
          )}
        </div>

        {Array.isArray(site.gallery_images) && site.gallery_images.length > 0 && (
          <section style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: primary }}>Galeria</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {(site.gallery_images as { url?: string; caption?: string }[]).filter((item) => item?.url).map((item, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  <div style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#e2e8f0" }}>
                    <SafeImage src={item.url} alt={item.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {item.caption && <figcaption style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.35rem" }}>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

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
