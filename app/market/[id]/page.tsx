"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

type Listing = {
  id: string;
  display_slug: string;
  slug_type: string;
  listing_type: string;
  price_usdc: string;
  current_bid_usdc: string | null;
  min_bid_usdc: string | null;
  end_at: string | null;
  status: string;
  seller_wallet: string;
  mini_site?: { site_name: string | null; slug: string | null };
  bids: { amount_usdc: string; bidder_wallet: string; created_at: string }[];
  highest_bid: { amount_usdc: string; bidder_wallet: string } | null;
  is_auction_ended: boolean;
};

export default function MarketListingPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const { addItem, hasItem } = useCart();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ["slug-listing", id],
    queryFn: async () => {
      const r = await fetch(`/api/slugs/${id}`);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Failed to load listing");
      return r.json() as Promise<Listing>;
    },
    enabled: !!id,
  });

  const canBuy = listing?.status === "active" && (listing.listing_type === "sale" || listing.is_auction_ended);
  const canBid = listing?.status === "active" && listing.listing_type === "auction" && !listing.is_auction_ended;

  const { data: paymentConfig } = useQuery({
    queryKey: ["payment-config", "SLUG_PURCHASE", id],
    queryFn: async () => {
      const r = await fetch(`/api/payments/config?type=SLUG_PURCHASE&reference_id=${encodeURIComponent(id)}`);
      if (!r.ok) return null;
      return r.json() as Promise<{ destination_wallet: string; amount_usdc: string; label: string }>;
    },
    enabled: canBuy && !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!address || !txHash.trim()) throw new Error("Connect wallet and enter payment tx_hash.");
      const r = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SLUG_PURCHASE",
          tx_hash: txHash.trim(),
          reference_id: id,
          payer_wallet: address,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Verification failed");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-listing", id] });
      setError(null);
      setTxHash("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const checkoutCardMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SLUG_PURCHASE",
          reference_id: id,
          success_url: typeof window !== "undefined" ? `${window.location.origin}/market/${id}?paid=1` : undefined,
          cancel_url: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Checkout failed");
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (e: Error) => setError(e.message),
  });

  const bidMutation = useMutation({
    mutationFn: async () => {
      if (!address || !bidAmount) throw new Error("Connect wallet and enter bid amount.");
      const r = await fetch(`/api/slugs/${id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidder_wallet: address, amount_usdc: bidAmount }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Bid failed");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-listing", id] });
      setError(null);
      setBidAmount("");
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading || !id) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", textAlign: "center", background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
        <p>Loading…</p>
        <Link href="/market" style={{ color: "#60a5fa" }}>← Market</Link>
      </main>
    );
  }

  if (isError || !listing) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", textAlign: "center", background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
        <p>Listing not found.</p>
        <Link href="/market" style={{ color: "#60a5fa" }}>← Back to Market</Link>
      </main>
    );
  }

  const currentPrice = listing.listing_type === "auction" && listing.current_bid_usdc
    ? listing.current_bid_usdc
    : listing.price_usdc;
  const minNextBid = listing.highest_bid
    ? (parseFloat(listing.highest_bid.amount_usdc) + parseFloat(listing.min_bid_usdc || "1")).toFixed(2)
    : listing.price_usdc;

  return (
    <main
      style={{
        fontFamily: "system-ui",
        maxWidth: 640,
        margin: "0 auto",
        padding: "1.5rem 1rem",
        background: "#0f172a",
        color: "#e2e8f0",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/market" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Slug Market
        </Link>
      </div>

      <header style={{ marginBottom: "1.5rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            textTransform: "uppercase",
          }}
        >
          {listing.slug_type === "handle" ? "Handle" : listing.slug_type === "company" ? "Company" : "Mini site"}
        </span>
        <h1 style={{ fontSize: "1.5rem", margin: "0.25rem 0 0", fontWeight: 700 }}>
          {listing.display_slug}
        </h1>
        {listing.listing_type === "auction" && (
          <p style={{ margin: "0.5rem 0 0", color: listing.is_auction_ended ? "#f59e0b" : "#22c55e", fontSize: "0.9rem" }}>
            {listing.is_auction_ended ? "Auction ended" : `Ends ${listing.end_at ? new Date(listing.end_at).toLocaleString() : "—"}`}
          </p>
        )}
      </header>

      <div
        style={{
          padding: "1.25rem",
          background: "#1e293b",
          borderRadius: 10,
          border: "1px solid #334155",
          marginBottom: "1rem",
        }}
      >
        <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {currentPrice} USDC
        </div>
        {listing.listing_type === "auction" && listing.bids?.length > 0 && (
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
            {listing.bids.length} bid(s). Highest: {listing.highest_bid?.amount_usdc} USDC
          </p>
        )}
      </div>

      {error && (
        <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.2)", borderRadius: 8, marginBottom: "1rem", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {canBid && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#94a3b8" }}>Place bid</h2>
          {!isConnected ? (
            <div>
              <p style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>Connect wallet to bid.</p>
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => connect({ connector: c })}
                  disabled={isConnectPending}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginRight: "0.5rem",
                  }}
                >
                  {isConnectPending ? "Connecting…" : `Connect ${c.name}`}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  Amount (USDC)
                </label>
                <input
                  type="text"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={minNextBid}
                  style={{
                    padding: "0.5rem",
                    borderRadius: 6,
                    border: "1px solid #334155",
                    background: "#0f172a",
                    color: "#e2e8f0",
                    width: 140,
                  }}
                />
              </div>
              <button
                onClick={() => bidMutation.mutate()}
                disabled={bidMutation.isPending || !bidAmount}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {bidMutation.isPending ? "Placing…" : "Place bid"}
              </button>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Min next bid: {minNextBid} USDC
              </span>
            </div>
          )}
        </section>
      )}

      {canBuy && paymentConfig && (
        <section>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#94a3b8" }}>
            {listing.is_auction_ended ? "Pay to claim (you won)" : "Buy now"}
          </h2>
          <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
            Send exactly <strong>{paymentConfig.amount_usdc} USDC</strong> to <code style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{paymentConfig.destination_wallet}</code>
          </p>
          {!isConnected ? (
            <div>
              <p style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>Connect wallet to verify crypto payment.</p>
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => connect({ connector: c })}
                  disabled={isConnectPending}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginRight: "0.5rem",
                  }}
                >
                  {isConnectPending ? "Connecting…" : `Connect ${c.name}`}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "0.75rem" }}>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Transaction hash (tx_hash)"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: 6,
                    border: "1px solid #334155",
                    background: "#0f172a",
                    color: "#e2e8f0",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending || !txHash.trim()}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {verifyMutation.isPending ? "Verifying…" : "Verify payment"}
                </button>
                <button
                  onClick={() => checkoutCardMutation.mutate()}
                  disabled={checkoutCardMutation.isPending}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {checkoutCardMutation.isPending ? "Redirecting…" : "Pay with card"}
                </button>
                {!hasItem("SLUG_PURCHASE", id) && (
                  <button
                    type="button"
                    onClick={() => addItem({
                      type: "SLUG_PURCHASE",
                      reference_id: id,
                      label: `Slug: ${listing.display_slug}`,
                      amount_usdc: paymentConfig.amount_usdc,
                    })}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#334155",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Add to cart
                  </button>
                )}
                <Link href="/cart" style={{ fontSize: "0.9rem", color: "#7dd3fc", alignSelf: "center" }}>View cart</Link>
              </div>
            </>
          )}
        </section>
      )}

      {listing.status !== "active" && (
        <p style={{ color: "#94a3b8" }}>This listing is no longer available.</p>
      )}
    </main>
  );
}
