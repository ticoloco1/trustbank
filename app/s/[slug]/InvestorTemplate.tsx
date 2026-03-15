"use client";

import Link from "next/link";
import { InvestorTickerBar } from "./InvestorTickerBar";
import {
  CryptoPricesWidget,
  NewsWidget,
  QuickAlertWidget,
} from "./InvestorSidebar";

type Idea = { id: string; title: string | null; content: string | null };

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  primary_color: string | null;
  accent_color: string | null;
  bg_color: string | null;
  ideas: Idea[];
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
        <InvestorTickerBar primaryColor={primary} />
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, margin: 0, color: primary }}>Feed</h2>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Your ideas, crypto picks, NFTs and market views.
          </p>
        </div>
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
