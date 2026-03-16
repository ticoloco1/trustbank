"use client";

import { useEffect, useState } from "react";

type Props = { primaryColor: string; barColor?: string | null };

export function InvestorTickerBar({ primaryColor, barColor }: Props) {
  const [prices, setPrices] = useState<{ btc: string; eth: string } | null>(null);
  const bg = (barColor && String(barColor).trim()) ? String(barColor).trim() : (primaryColor || "rgba(0,0,0,0.04)");
  const isDarkHex = /^#[0-9A-Fa-f]{6}$/.test(bg) && (parseInt(bg.slice(1, 3), 16) + parseInt(bg.slice(3, 5), 16) + parseInt(bg.slice(5, 7), 16)) < 384;
  const textColor = isDarkHex ? "#fff" : undefined;

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
        background: bg,
        color: textColor,
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
