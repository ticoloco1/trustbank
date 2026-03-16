"use client";

import Link from "next/link";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";
import SafeImage from "./SafeImage";

type Idea = { id: string; title: string | null; content: string | null; image_url: string | null };
type GalleryItem = { url: string; caption?: string };
type ListedDomain = { id: string; name: string; slug: string; price: string | null; link: string | null; status: string };

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  primary_color: string | null;
  accent_color: string | null;
  bg_color: string | null;
  banner_url?: string | null;
  feed_image_1?: string | null;
  feed_image_2?: string | null;
  feed_image_3?: string | null;
  feed_image_4?: string | null;
  gallery_images?: GalleryItem[] | null;
  ideas: Idea[];
  listed_domains?: ListedDomain[];
};

const CARD_STYLE = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.04)",
};

export default function PremiumFintechTemplate({ site }: { site: Site }) {
  const primary = site.primary_color ?? "#0d9488";
  const accent = site.accent_color ?? "#06b6d4";
  const bg = site.bg_color ?? "#f0fdfa";
  const slug = site.slug ?? "";
  const gradient = `linear-gradient(135deg, ${primary} 0%, ${accent} 50%, #6366f1 100%)`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {slug && (
        <div style={{ padding: "0.75rem 1.5rem", background: "rgba(255,255,255,0.8)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}

      {/* Hero gradiente moderno */}
      <header
        style={{
          background: gradient,
          color: "#fff",
          padding: "3rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 24px 24px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        }}
      >
        {site.banner_url && (
          <div style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            <SafeImage src={site.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
            ← TrustBank
          </Link>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              margin: "1.5rem auto 1rem",
              overflow: "hidden",
              background: "rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {site.feed_image_1 ? (
              <SafeImage src={site.feed_image_1} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>◇</div>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            {site.site_name || "Premium"}
          </h1>
          {site.bio && (
            <p style={{ fontSize: "1rem", opacity: 0.95, maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
              {site.bio}
            </p>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Cards de fotos */}
        {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).length > 0 && (
          <section style={{ marginBottom: "2.5rem", marginTop: "-2rem", position: "relative", zIndex: 2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).map((url, i) => (
                <div key={i} style={{ ...CARD_STYLE, overflow: "hidden", aspectRatio: "1" }}>
                  <SafeImage src={url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Domínios em cards */}
        {site.listed_domains && site.listed_domains.filter((d) => d.status === "available").length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: primary, marginBottom: "1rem" }}>Premium Domains</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {site.listed_domains.filter((d) => d.status === "available").map((d) => (
                <div key={d.id} style={{ ...CARD_STYLE, padding: "1.25rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <Link href={`/d/${d.slug}`} style={{ color: primary, fontWeight: 600, textDecoration: "none", fontSize: "1.05rem" }}>{d.name}</Link>
                    {d.price && <span style={{ display: "block", color: accent, fontWeight: 600, marginTop: 4 }}>${d.price}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {d.link && <a href={d.link} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 18px", background: gradient, color: "#fff", borderRadius: 12, fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>Buy now</a>}
                    <Link href={`/d/${d.slug}`} style={{ padding: "10px 18px", border: `2px solid ${primary}`, color: primary, borderRadius: 12, fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>View</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Posts em cards */}
        {site.ideas && site.ideas.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: primary, marginBottom: "1rem" }}>Updates</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {site.ideas.map((idea) => (
                <div key={idea.id} style={{ ...CARD_STYLE, padding: "1.5rem" }}>
                  {idea.title && <strong style={{ display: "block", marginBottom: "0.5rem", color: primary, fontSize: "1.05rem" }}>{idea.title}</strong>}
                  {idea.image_url && (
                    <div style={{ marginBottom: "0.75rem", borderRadius: 12, overflow: "hidden", maxHeight: 320 }}>
                      <SafeImage src={idea.image_url} alt="" style={{ width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} />
                    </div>
                  )}
                  {idea.content && <p style={{ margin: 0, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{idea.content}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Galeria */}
        {Array.isArray(site.gallery_images) && site.gallery_images.filter((i: { url?: string }) => i?.url).length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: primary, marginBottom: "1rem" }}>Gallery</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {site.gallery_images.filter((i: { url?: string }) => i?.url).map((item: { url: string; caption?: string }, i: number) => (
                <figure key={i} style={{ margin: 0 }}>
                  <div style={{ ...CARD_STYLE, aspectRatio: "1", overflow: "hidden" }}>
                    <SafeImage src={item.url} alt={item.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {item.caption && <figcaption style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.4rem" }}>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ ...CARD_STYLE, padding: "2rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.95rem" }}>Slug marketplace · Buy, sell or auction @handles</p>
          <Link href="/market" style={{ display: "inline-block", padding: "12px 24px", background: gradient, color: "#fff", borderRadius: 12, fontWeight: 600, textDecoration: "none", fontSize: "0.95rem" }}>
            Browse marketplace →
          </Link>
        </section>
      </div>
    </div>
  );
}
