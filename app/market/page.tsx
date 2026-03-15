"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  display_slug: string;
  slug_type: string;
  listing_type: string;
  price_usdc: string;
  current_bid_usdc: string | null;
  end_at: string | null;
  status: string;
  mini_site?: { site_name: string | null; slug: string | null };
  highest_bid?: { amount_usdc: string; bidder_wallet: string } | null;
};

export default function MarketPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<"all" | "sale" | "auction">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const type = filter === "all" ? "" : filter;
    const url = type ? `/api/slugs?type=${type}` : "/api/slugs";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            href="/"
            style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}
          >
            ← Home
          </Link>
        </div>

        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: 700 }}>
            Slug Marketplace
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>
            Buy or bid on company / @ handles and mini-site slugs. List yours from the dashboard.
          </p>
        </header>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {(["all", "sale", "auction"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.5rem 1rem",
                background: filter === f ? "#3b82f6" : "#334155",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All" : f === "sale" ? "Buy now" : "Auctions"}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading listings…</p>
        ) : listings.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            No listings yet. List a slug from your dashboard or create a company / @ handle listing.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
            {listings.map((l) => {
              const isAuction = l.listing_type === "auction";
              const ended = isAuction && l.end_at && new Date(l.end_at) <= new Date();
              const currentPrice = isAuction && l.current_bid_usdc ? l.current_bid_usdc : l.price_usdc;
              return (
                <li
                  key={l.id}
                  style={{
                    padding: "1rem 1.25rem",
                    background: "#1e293b",
                    borderRadius: 10,
                    border: "1px solid #334155",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          marginRight: "0.5rem",
                        }}
                      >
                        {l.slug_type === "handle" ? "Handle" : l.slug_type === "company" ? "Company" : "Mini site"}
                      </span>
                      <span
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          color: "#f1f5f9",
                        }}
                      >
                        {l.display_slug}
                      </span>
                      {isAuction && (
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.8rem",
                            color: ended ? "#f59e0b" : "#22c55e",
                          }}
                        >
                          {ended ? "Ended" : "Auction"}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e2e8f0" }}>
                        {currentPrice} USDC
                      </span>
                      {isAuction && !ended && l.end_at && (
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                          Ends {new Date(l.end_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    <Link
                      href={`/market/${l.id}`}
                      style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        background: "#3b82f6",
                        color: "#fff",
                        borderRadius: 6,
                        textDecoration: "none",
                        fontSize: "0.9rem",
                      }}
                    >
                      {isAuction && !ended ? "View & place bid" : "View & buy"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p style={{ marginTop: "2rem", fontSize: "0.85rem", color: "#64748b" }}>
          List your mini-site or reserve a company / @ slug from the{" "}
          <Link href="/dashboard" style={{ color: "#60a5fa" }}>
            dashboard
          </Link>
          . Payments in USDC (crypto) or card; 10% platform fee.
        </p>
      </div>
    </main>
  );
}
