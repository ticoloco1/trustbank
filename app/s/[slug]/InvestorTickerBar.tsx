"use client";

import { useEffect, useState } from "react";

type Props = { primaryColor: string };

export function InvestorTickerBar({ primaryColor }: Props) {
  const [prices, setPrices] = useState<{ btc: string; eth: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    )
      .then((r) => r.json())
      .then((data: { bitcoin?: { usd?: number }; ethereum?: { usd?: number } }) => {
        if (cancelled) return;
        setPrices({
          btc: data.bitcoin?.usd != null ? `$${data.bitcoin.usd.toLocaleString()}` : "—",
          eth: data.ethereum?.usd != null ? `$${data.ethereum.usd.toLocaleString()}` : "—",
        });
      })
      .catch(() => setPrices({ btc: "—", eth: "—" }));
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      style={{
        padding: "8px 16px",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.02)",
        fontSize: 12,
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span style={{ color: primaryColor, fontWeight: 600 }}>BTC</span>
      <span>{prices?.btc ?? "…"}</span>
      <span style={{ color: primaryColor, fontWeight: 600 }}>ETH</span>
      <span>{prices?.eth ?? "…"}</span>
    </div>
  );
}
