"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

export default function GlobalFooter() {
  const { address, isConnected } = useAccount();

  const { data: summary } = useQuery({
    queryKey: ["credits-summary", address ?? ""],
    queryFn: async () => {
      if (!address) return null;
      const r = await fetch(`/api/credits/summary?wallet=${encodeURIComponent(address)}`);
      if (!r.ok) return null;
      return r.json() as Promise<{
        balance_usdc: string;
        total_deposited: string;
        total_withdrawn: string;
        shares: { video_id: string; video_title: string | null; ticker: string | null; shares: number }[];
      }>;
    },
    enabled: !!address && isConnected,
  });

  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "1rem 1.5rem",
        background: "#0f172a",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.85rem",
        borderTop: "1px solid #334155",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Link href="/" style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: 600 }}>
            TrustBank
          </Link>
          <span style={{ marginLeft: "0.5rem", color: "#64748b" }}>· 1 crédito = 1 USDC</span>
        </div>
        {address && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/credits" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 500 }}>
              Créditos
            </Link>
            {summary && (
              <>
                <span title="Saldo disponível">
                  Saldo: <strong style={{ color: "#86efac" }}>${summary.balance_usdc}</strong>
                </span>
                <span title="Total depositado">Entradas: ${summary.total_deposited}</span>
                <span title="Total retirado">Saídas: ${summary.total_withdrawn}</span>
                {summary.shares.length > 0 && (
                  <span title="Cotas em vídeos">
                    Cotas: {summary.shares.length} vídeo(s)
                  </span>
                )}
              </>
            )}
          </div>
        )}
        {!address && (
          <Link href="/credits" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.9rem" }}>
            Créditos TrustBank
          </Link>
        )}
      </div>
    </footer>
  );
}
