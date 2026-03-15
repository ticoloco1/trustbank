"use client";

import { useEffect, useState } from "react";

type Props = {
  primaryColor: string;
  accentColor: string;
};

export function CryptoPricesWidget({ primaryColor, accentColor }: Props) {
  const [data, setData] = useState<Record<string, { usd?: number }> | null>(null);
  useEffect(() => {
    let c = false;
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=usd"
    )
      .then((r) => r.json())
      .then((d) => { if (!c) setData(d); })
      .catch(() => setData(null));
    return () => { c = true; };
  }, []);

  const list = [
    { id: "bitcoin", label: "BTC", color: primaryColor },
    { id: "ethereum", label: "ETH", color: accentColor },
    { id: "solana", label: "SOL", color: primaryColor },
    { id: "cardano", label: "ADA", color: accentColor },
  ];

  return (
    <div style={{ padding: 12, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px", color: primaryColor }}>
        Crypto
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
        {list.map(({ id, label, color }) => (
          <li
            key={id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              color: "#333",
            }}
          >
            <span style={{ color }}>{label}</span>
            <span>
              {data?.[id]?.usd != null
                ? `$${data[id].usd.toLocaleString()}`
                : "…"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NewsWidget({ primaryColor }: { primaryColor: string }) {
  return (
    <div style={{ padding: 12, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px", color: primaryColor }}>
        News
      </h3>
      <p style={{ fontSize: 11, color: "#666", margin: 0 }}>
        Add links or RSS in dashboard to show market news here.
      </p>
    </div>
  );
}

export function QuickAlertWidget({ accentColor }: { accentColor: string }) {
  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px", color: accentColor }}>
        Price alerts
      </h3>
      <p style={{ fontSize: 11, color: "#666", margin: 0 }}>
        Set alerts for BTC, ETH and more from your dashboard.
      </p>
    </div>
  );
}
