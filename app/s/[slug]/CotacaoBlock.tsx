"use client";

import { useEffect, useState } from "react";

type Props = { symbol: string | null; label: string | null };

/** Exibe cotação: se tiver symbol (BTC, ETH), busca preço; senão mostra label. */
export function CotacaoBlock({ symbol, label }: Props) {
  const [price, setPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!symbol);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const id = symbol.toLowerCase();
    fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,brl`
    )
      .then((r) => r.json())
      .then((data: Record<string, { usd?: number; brl?: number }>) => {
        if (cancelled) return;
        const btc = data.bitcoin;
        const eth = data.ethereum;
        let value: string | null = null;
        if (id === "btc" && btc) value = `BTC $${btc.usd?.toLocaleString() ?? "—"} / R$ ${btc.brl?.toLocaleString() ?? "—"}`;
        else if (id === "eth" && eth) value = `ETH $${eth.usd?.toLocaleString() ?? "—"} / R$ ${eth.brl?.toLocaleString() ?? "—"}`;
        setPrice(value);
      })
      .catch(() => setPrice(null))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [symbol]);

  if (loading) return <p style={{ color: "#666" }}>Carregando cotação…</p>;
  if (price) return <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>{price}</p>;
  if (label) return <p style={{ fontSize: "1.1rem" }}>{label}</p>;
  return null;
}
