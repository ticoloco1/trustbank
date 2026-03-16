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

export default function PremiumDarkTemplate({ site }: { site: Site }) {
  const primary = site.primary_color ?? "#0a0a0a";
  const accent = site.accent_color ?? "#d4af37";
  const bg = site.bg_color ?? "#0a0a0a";
  const slug = site.slug ?? "";
  const textMuted = "rgba(255,255,255,0.6)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: "#fff",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {slug && (
        <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}

      {/* Hero luxo — full bleed escuro */}
      <header
        style={{
          position: "relative",
          padding: "4rem 1.5rem 5rem",
          overflow: "hidden",
        }}
      >
        {site.banner_url && (
          <div style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            <SafeImage src={site.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <Link href="/" style={{ color: textMuted, textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ← TrustBank
          </Link>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              margin: "2rem auto 1.5rem",
              overflow: "hidden",
              border: `2px solid ${accent}`,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            {site.feed_image_1 ? (
              <SafeImage src={site.feed_image_1} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", color: accent }}>◆</div>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, margin: "0 0 0.75rem", letterSpacing: "0.02em" }}>
            {site.site_name || "Premium"}
          </h1>
          {site.bio && (
            <p style={{ fontSize: "1.05rem", color: textMuted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              {site.bio}
            </p>
          )}
        </div>
      </header>

      {/* Divisor dourado */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Grid de fotos */}
        {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).map((url, i) => (
                <div key={i} style={{ aspectRatio: "1", overflow: "hidden", border: `1px solid rgba(255,255,255,0.1)` }}>
                  <SafeImage src={url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Domínios */}
        {site.listed_domains && site.listed_domains.filter((d) => d.status === "available").length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: "1.25rem" }}>
              Premium Domains
            </h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {site.listed_domains.filter((d) => d.status === "available").map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1.25rem 1.5rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div>
                    <Link href={`/d/${d.slug}`} style={{ color: "#fff", textDecoration: "none", fontSize: "1.1rem" }}>{d.name}</Link>
                    {d.price && <span style={{ display: "block", color: accent, fontSize: "0.9rem", marginTop: 4 }}>${d.price}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {d.link && <a href={d.link} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", background: accent, color: primary, textDecoration: "none", fontSize: "0.85rem" }}>Buy now</a>}
                    <Link href={`/d/${d.slug}`} style={{ padding: "8px 16px", border: `1px solid ${accent}`, color: accent, textDecoration: "none", fontSize: "0.85rem" }}>View</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Posts */}
        {site.ideas && site.ideas.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: "1.25rem" }}>
              Updates
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {site.ideas.map((idea) => (
                <li
                  key={idea.id}
                  style={{
                    padding: "1.5rem",
                    marginBottom: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {idea.title && <strong style={{ display: "block", marginBottom: "0.5rem", color: "#fff", fontSize: "1.1rem" }}>{idea.title}</strong>}
                  {idea.image_url && (
                    <div style={{ marginBottom: "0.75rem", maxHeight: 360, overflow: "hidden" }}>
                      <SafeImage src={idea.image_url} alt="" style={{ width: "100%", height: "auto", maxHeight: 360, objectFit: "cover" }} />
                    </div>
                  )}
                  {idea.content && <p style={{ margin: 0, color: textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{idea.content}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Galeria */}
        {Array.isArray(site.gallery_images) && site.gallery_images.filter((i: { url?: string }) => i?.url).length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: "1.25rem" }}>Gallery</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {site.gallery_images.filter((i: { url?: string }) => i?.url).map((item: { url: string; caption?: string }, i: number) => (
                <figure key={i} style={{ margin: 0 }}>
                  <div style={{ aspectRatio: "1", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <SafeImage src={item.url} alt={item.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {item.caption && <figcaption style={{ fontSize: "0.8rem", color: textMuted, marginTop: "0.35rem" }}>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ margin: "0 0 1rem", color: textMuted, fontSize: "0.9rem" }}>Slug marketplace · Buy, sell or auction @handles</p>
          <Link href="/market" style={{ display: "inline-block", padding: "12px 24px", border: `1px solid ${accent}`, color: accent, textDecoration: "none", fontSize: "0.9rem" }}>
            Browse marketplace →
          </Link>
        </section>
      </div>
    </div>
  );
}
