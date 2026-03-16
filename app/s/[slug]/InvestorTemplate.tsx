"use client";

import Link from "next/link";
import { InvestorTickerBar } from "./InvestorTickerBar";
import { CotacaoBlock } from "./CotacaoBlock";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";
import SafeImage from "./SafeImage";
import {
  CryptoPricesWidget,
  NewsWidget,
  QuickAlertWidget,
} from "./InvestorSidebar";

type Idea = { id: string; title: string | null; content: string | null; image_url: string | null };

type GalleryItem = { url: string; caption?: string };

type ListedDomain = { id: string; name: string; slug: string; price: string | null; description: string | null; link: string | null; status: string };

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  primary_color: string | null;
  accent_color: string | null;
  bg_color: string | null;
  cotacao_symbol?: string | null;
  cotacao_label?: string | null;
  ticker_bar_color?: string | null;
  banner_url?: string | null;
  feed_image_1?: string | null;
  feed_image_2?: string | null;
  feed_image_3?: string | null;
  feed_image_4?: string | null;
  gallery_images?: GalleryItem[] | null;
  ideas: Idea[];
  listed_domains?: ListedDomain[];
};

const NAV_ITEMS = [
  { id: "feed", label: "Feed", icon: "◈" },
  { id: "portfolio", label: "Portfolio", icon: "◎" },
  { id: "markets", label: "Markets", icon: "◉" },
  { id: "crypto", label: "Crypto", icon: "⬡" },
  { id: "stocks", label: "Stocks", icon: "◫" },
  { id: "nft", label: "NFTs", icon: "◈" },
  { id: "news", label: "News", icon: "◷" },
  { id: "launches", label: "Launches", icon: "⬆" },
  { id: "alerts", label: "Price alerts", icon: "◐" },
];

export default function InvestorTemplate({ site }: { site: Site }) {
  const primary = site.primary_color ?? "#2563eb";
  const accent = site.accent_color ?? "#7c3aed";
  const bg = site.bg_color ?? "#f8fafc";

  const slug = site.slug ?? "";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr 260px",
        minHeight: "100vh",
        background: bg,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {slug && (
        <div style={{ gridColumn: "1 / -1", padding: "0 1rem", paddingTop: "1rem" }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}
      {/* Left — nav */}
      <aside
        style={{
          borderRight: "0.5px solid rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.8)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <Link href="/" style={{ color: primary, textDecoration: "none", fontSize: 13 }}>
            ← TrustBank
          </Link>
        </div>
        <div style={{ padding: "16px 12px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          {site.banner_url && (
            <div style={{ width: "100%", height: 72, borderRadius: 8, overflow: "hidden", marginBottom: 8, background: "#e2e8f0" }}>
              <SafeImage src={site.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ fontSize: 15, fontWeight: 600, color: primary }}>
            {site.site_name || "Investor"}
          </div>
          {site.bio && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{site.bio}</div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                color: "#555",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Center — feed */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "0.5px solid rgba(0,0,0,0.08)",
          background: "rgba(255,255,255,0.6)",
          minHeight: "100vh",
        }}
      >
        <InvestorTickerBar primaryColor={primary} barColor={site.ticker_bar_color} />
        {(site.cotacao_symbol || site.cotacao_label) && (
          <div style={{ padding: "12px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 13, margin: "0 0 8px", color: primary }}>Cotação</h2>
            <CotacaoBlock symbol={site.cotacao_symbol ?? null} label={site.cotacao_label ?? null} />
          </div>
        )}
        {Array.isArray(site.listed_domains) && site.listed_domains.filter((d) => d.status === "available").length > 0 && (
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 14, margin: 0, color: primary }}>Premium Domains</h2>
            <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Domains for sale — price, make offer, buy now.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {site.listed_domains.filter((d) => d.status === "available").map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: 14,
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <Link href={`/d/${d.slug}`} style={{ fontSize: 15, fontWeight: 600, color: primary, textDecoration: "none" }}>{d.name}</Link>
                    {d.price && <span style={{ display: "block", fontSize: 13, color: "#0d9488", marginTop: 2 }}>${d.price}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {d.link && (
                      <a href={d.link} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: accent, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Buy now</a>
                    )}
                    <Link href={`/d/${d.slug}`} style={{ padding: "6px 12px", background: "transparent", color: primary, border: `1px solid ${primary}`, borderRadius: 6, fontSize: 12, textDecoration: "none" }}>Make offer / View</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, margin: 0, color: primary }}>Feed</h2>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Your ideas, crypto picks, NFTs and market views.
          </p>
        </div>
        {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).length > 0 && (
          <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, borderRadius: 12, overflow: "hidden" }}>
              {[site.feed_image_1, site.feed_image_2, site.feed_image_3, site.feed_image_4].filter(Boolean).map((url, i) => (
                <div key={i} style={{ aspectRatio: "1", background: "#e2e8f0" }}>
                  <SafeImage src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
          {!site.ideas || site.ideas.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                fontSize: 14,
                color: "#666",
              }}
            >
              No posts yet. Add ideas in the dashboard to show them here.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {site.ideas.map((idea) => (
                <li
                  key={idea.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    background: "#fff",
                    borderRadius: 12,
                    borderLeft: `4px solid ${accent}`,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  {idea.title && (
                    <strong
                      style={{
                        display: "block",
                        marginBottom: 6,
                        color: primary,
                        fontSize: 14,
                      }}
                    >
                      {idea.title}
                    </strong>
                  )}
                  {idea.image_url && (
                    <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", maxHeight: 280 }}>
                      <SafeImage src={idea.image_url} alt="" style={{ width: "100%", height: "auto", maxHeight: 280, objectFit: "cover" }} />
                    </div>
                  )}
                  {idea.content && (
                    <p
                      style={{
                        margin: 0,
                        color: "#333",
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {idea.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {Array.isArray(site.gallery_images) && site.gallery_images.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 13, margin: "0 0 12px", color: primary }}>Galeria</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {site.gallery_images.filter((item: { url?: string }) => item?.url).map((item: { url: string; caption?: string }, i: number) => (
                  <figure key={i} style={{ margin: 0 }}>
                    <div style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#e2e8f0" }}>
                      <SafeImage src={item.url} alt={item.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    {item.caption && <figcaption style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{item.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right — widgets */}
      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.8)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <CryptoPricesWidget primaryColor={primary} accentColor={accent} />
        <NewsWidget primaryColor={primary} />
        <QuickAlertWidget accentColor={accent} />
        <div style={{ padding: 12, marginTop: "auto", borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
          <Link
            href="/market"
            style={{ fontSize: 12, color: accent, fontWeight: 600, textDecoration: "none" }}
          >
            Slug marketplace →
          </Link>
        </div>
      </aside>
    </div>
  );
}
