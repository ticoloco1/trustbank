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

const TRUST_ITEMS = [
  { icon: "🛡", label: "Secure" },
  { icon: "🔒", label: "Protected" },
  { icon: "✓", label: "Verified" },
];

export default function PremiumTemplate({ site }: { site: Site }) {
  const primary = site.primary_color ?? "#0f172a";
  const accent = site.accent_color ?? "#c9a227";
  const bg = site.bg_color ?? "#f8fafc";
  const slug = site.slug ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {slug && (
        <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}

      {/* Hero estilo banco */}
      <header
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 50%, #1e293b 100%)`,
          color: "#fff",
          padding: "3rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {site.banner_url && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.25,
            }}
          >
            <SafeImage
              src={site.banner_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              color: "rgba(255,255,255,0.9)",
              textDecoration: "none",
              fontSize: "0.9rem",
              display: "inline-block",
              marginBottom: "1.5rem",
            }}
          >
            ← TrustBank
          </Link>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              margin: "0 auto 1rem",
              overflow: "hidden",
              border: `3px solid ${accent}`,
              background: "rgba(255,255,255,0.15)",
            }}
          >
            {site.feed_image_1 ? (
              <SafeImage
                src={site.feed_image_1}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                ◉
              </div>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            {site.site_name || "Premium"}
          </h1>
          {site.bio && (
            <p style={{ fontSize: "1.1rem", opacity: 0.95, maxWidth: 560, margin: "0 auto", lineHeight: 1.5 }}>
              {site.bio}
            </p>
          )}
        </div>
      </header>

      {/* Faixa de confiança */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "2rem",
          padding: "1.25rem 1.5rem",
          background: "rgba(255,255,255,0.9)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: primary, fontSize: "0.9rem", fontWeight: 500 }}>
            <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Grid de fotos do feed */}
        {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.75rem",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              }}
            >
              {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4]
                .filter(Boolean)
                .map((url, i) => (
                  <div key={i} style={{ aspectRatio: "1", background: "#e2e8f0" }}>
                    <SafeImage src={url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Domínios premium (se houver) */}
        {site.listed_domains && site.listed_domains.filter((d) => d.status === "available").length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: primary, marginBottom: "1rem", borderBottom: `2px solid ${accent}`, paddingBottom: "0.5rem" }}>
              Premium Domains
            </h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {site.listed_domains
                .filter((d) => d.status === "available")
                .map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "1rem 1.25rem",
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <Link href={`/d/${d.slug}`} style={{ fontSize: "1rem", fontWeight: 600, color: primary, textDecoration: "none" }}>
                        {d.name}
                      </Link>
                      {d.price && (
                        <span style={{ display: "block", fontSize: "0.9rem", color: accent, marginTop: 2, fontWeight: 600 }}>
                          ${d.price}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {d.link && (
                        <a
                          href={d.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "8px 16px",
                            background: accent,
                            color: primary,
                            borderRadius: 8,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Buy now
                        </a>
                      )}
                      <Link
                        href={`/d/${d.slug}`}
                        style={{
                          padding: "8px 16px",
                          border: `2px solid ${primary}`,
                          color: primary,
                          borderRadius: 8,
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        View / Offer
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Posts / Ideias */}
        {site.ideas && site.ideas.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: primary, marginBottom: "1rem", borderBottom: `2px solid ${accent}`, paddingBottom: "0.5rem" }}>
              Updates
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {site.ideas.map((idea) => (
                <li
                  key={idea.id}
                  style={{
                    padding: "1.25rem",
                    marginBottom: "1rem",
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    borderLeft: `4px solid ${accent}`,
                  }}
                >
                  {idea.title && (
                    <strong style={{ display: "block", marginBottom: "0.35rem", color: primary, fontSize: "1.05rem" }}>
                      {idea.title}
                    </strong>
                  )}
                  {idea.image_url && (
                    <div style={{ marginBottom: "0.75rem", borderRadius: 8, overflow: "hidden", maxHeight: 340 }}>
                      <SafeImage
                        src={idea.image_url}
                        alt=""
                        style={{ width: "100%", height: "auto", maxHeight: 340, objectFit: "cover" }}
                      />
                    </div>
                  )}
                  {idea.content && (
                    <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {idea.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Galeria */}
        {Array.isArray(site.gallery_images) && site.gallery_images.filter((i: { url?: string }) => i?.url).length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: primary, marginBottom: "1rem", borderBottom: `2px solid ${accent}`, paddingBottom: "0.5rem" }}>
              Gallery
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {site.gallery_images
                .filter((item: { url?: string }) => item?.url)
                .map((item: { url: string; caption?: string }, i: number) => (
                  <figure key={i} style={{ margin: 0 }}>
                    <div
                      style={{
                        aspectRatio: "1",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#e2e8f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      <SafeImage src={item.url} alt={item.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    {item.caption && (
                      <figcaption style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.4rem" }}>
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
            </div>
          </section>
        )}

        {/* CTA final */}
        <section
          style={{
            padding: "2rem",
            background: `linear-gradient(135deg, ${primary}08 0%, ${accent}12 100%)`,
            borderRadius: 12,
            border: `1px solid ${accent}40`,
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 1rem", color: primary, fontWeight: 600 }}>
            Slug marketplace · Buy, sell or auction @handles
          </p>
          <Link
            href="/market"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: primary,
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Browse marketplace →
          </Link>
        </section>
      </div>
    </div>
  );
}
