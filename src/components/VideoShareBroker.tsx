"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useState } from "react";

type SharesData = {
  video_id: string;
  quotation: { total_shares: number; valuation_usdc: string | null; system_percent: number; sellable_percent: number; revenue_usdc: string | null; ticker_symbol: string | null } | null;
  total_shares: number;
  sellable_shares: number;
  available_from_pool: number;
  total_held: number;
  order_book: { sell: { id: string; wallet: string; amount_shares: number; price_per_share_usdc: string }[]; buy: { id: string; wallet: string; amount_shares: number; price_per_share_usdc: string }[] };
  my_holdings?: number;
  my_orders?: { id: string; order_type: string; amount_shares: number; price_per_share_usdc: string; status: string }[];
};

type VideoShareBrokerProps = {
  videoId: string;
  title?: string | null;
  ticker?: string | null;
};

export function VideoShareBroker({ videoId, title, ticker }: VideoShareBrokerProps) {
  const { address } = useAccount();
  const qc = useQueryClient();
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  const { data: creditBalance } = useQuery({
    queryKey: ["credits-balance", address ?? ""],
    queryFn: async () => {
      if (!address) return null;
      const r = await fetch(`/api/credits/balance?wallet=${encodeURIComponent(address)}`);
      if (!r.ok) return null;
      const j = await r.json();
      return j.balance_usdc as string;
    },
    enabled: !!address,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["video-shares", videoId, address ?? ""],
    queryFn: async () => {
      const url = `/api/videos/${videoId}/shares${address ? `?wallet=${encodeURIComponent(address)}` : ""}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to load");
      return r.json() as Promise<SharesData>;
    },
    enabled: !!videoId,
  });

  const buyFromPoolMutation = useMutation({
    mutationFn: async (amount: number) => {
      const r = await fetch(`/api/videos/${videoId}/shares/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, amount_shares: amount }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video-shares", videoId] }),
  });

  const sellOrderMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/videos/${videoId}/shares/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          order_type: "sell",
          amount_shares: parseInt(sellAmount, 10),
          price_per_share_usdc: sellPrice,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video-shares", videoId] });
      setSellAmount("");
      setSellPrice("");
    },
  });

  const fillOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const r = await fetch(`/api/videos/${videoId}/shares/orders/${orderId}/fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_wallet: address }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video-shares", videoId] }),
  });

  if (isLoading || !data) {
    return (
      <div style={{ padding: "1.5rem", background: "#1e293b", borderRadius: 12, color: "#94a3b8" }}>
        Carregando corretora…
      </div>
    );
  }

  const valuation = data.quotation?.valuation_usdc ? `$${Number(data.quotation.valuation_usdc).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";
  const revenue = data.quotation?.revenue_usdc ? `$${data.quotation.revenue_usdc}` : "—";
  const pricePerShare = data.quotation?.valuation_usdc && data.total_shares
    ? (parseFloat(data.quotation.valuation_usdc) / data.total_shares).toFixed(4)
    : "—";

  return (
    <div style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 12, overflow: "hidden", border: "1px solid #334155" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #334155", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Valuation</span>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{valuation}</div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Receita acum.</span>
          <div style={{ fontWeight: 600 }}>{revenue}</div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Preço/share (ref.)</span>
          <div style={{ fontWeight: 600 }}>${pricePerShare}</div>
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Pool disponível</span>
          <div style={{ fontWeight: 600 }}>{data.available_from_pool.toLocaleString()} shares</div>
        </div>
        {address && data.my_holdings != null && (
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Minhas cotas</span>
            <div style={{ fontWeight: 700, color: "#86efac" }}>{data.my_holdings.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: 200 }}>
        <div style={{ padding: "1rem", borderRight: "1px solid #334155" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>Vendas (ask)</h4>
          <div style={{ fontSize: "0.85rem" }}>
            {data.order_book.sell.length === 0 ? (
              <p style={{ color: "#64748b", margin: 0 }}>Nenhuma oferta de venda</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                    <th style={{ textAlign: "left", padding: "0.25rem 0" }}>Preço</th>
                    <th style={{ textAlign: "right", padding: "0.25rem 0" }}>Qtd</th>
                    <th style={{ padding: 0 }} />
                  </tr>
                </thead>
                <tbody>
                  {data.order_book.sell.slice(0, 10).map((o) => (
                    <tr key={o.id} style={{ borderTop: "1px solid #334155" }}>
                      <td style={{ padding: "0.35rem 0", color: "#f87171" }}>${o.price_per_share_usdc}</td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{o.amount_shares.toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>
                        {address && (
                          <button
                            type="button"
                            onClick={() => fillOrderMutation.mutate(o.id)}
                            disabled={fillOrderMutation.isPending}
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", background: "#22c55e", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer" }}
                          >
                            Comprar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div style={{ padding: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#94a3b8" }}>Compras (bid)</h4>
          <div style={{ fontSize: "0.85rem" }}>
            {data.order_book.buy.length === 0 ? (
              <p style={{ color: "#64748b", margin: 0 }}>Nenhuma ordem de compra</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                    <th style={{ textAlign: "left", padding: "0.25rem 0" }}>Preço</th>
                    <th style={{ textAlign: "right", padding: "0.25rem 0" }}>Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {data.order_book.buy.slice(0, 10).map((o) => (
                    <tr key={o.id} style={{ borderTop: "1px solid #334155" }}>
                      <td style={{ padding: "0.35rem 0", color: "#86efac" }}>${o.price_per_share_usdc}</td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{o.amount_shares.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {address && (
        <div style={{ padding: "1rem", borderTop: "1px solid #334155", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", color: "#94a3b8" }}>Comprar do pool (IPO)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                min={1}
                max={data.available_from_pool}
                placeholder="Qtd shares"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                style={{ width: 100, padding: "0.4rem", background: "#1e293b", border: "1px solid #475569", borderRadius: 6, color: "#fff" }}
              />
              <button
                type="button"
                onClick={() => buyAmount && buyFromPoolMutation.mutate(parseInt(buyAmount, 10))}
                disabled={!buyAmount || buyFromPoolMutation.isPending || data.available_from_pool === 0}
                style={{ padding: "0.4rem 0.75rem", background: "#22c55e", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
              >
                {buyFromPoolMutation.isPending ? "…" : "Comprar"}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", color: "#94a3b8" }}>Vender (minhas cotas)</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="number"
                placeholder="Qtd"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                style={{ width: 70, padding: "0.4rem", background: "#1e293b", border: "1px solid #475569", borderRadius: 6, color: "#fff" }}
              />
              <input
                type="text"
                placeholder="Preço/share"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                style={{ width: 90, padding: "0.4rem", background: "#1e293b", border: "1px solid #475569", borderRadius: 6, color: "#fff" }}
              />
              <button
                type="button"
                onClick={() => sellOrderMutation.mutate()}
                disabled={!sellAmount || !sellPrice || sellOrderMutation.isPending || (data.my_holdings ?? 0) < parseInt(sellAmount, 10)}
                style={{ padding: "0.4rem 0.75rem", background: "#ef4444", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
              >
                {sellOrderMutation.isPending ? "…" : "Colocar à venda"}
              </button>
            </div>
          </div>
        </div>
      )}

      {address && creditBalance != null && (
        <div style={{ padding: "0.5rem 1rem", borderTop: "1px solid #334155", fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Créditos: <strong style={{ color: "#86efac" }}>${creditBalance}</strong></span>
          <Link href="/credits" style={{ color: "#38bdf8", marginLeft: "0.5rem" }}>Depositar / Retirar</Link>
        </div>
      )}
      {!address && (
        <div style={{ padding: "1rem", borderTop: "1px solid #334155", color: "#94a3b8", fontSize: "0.9rem" }}>
          Conecte sua carteira para comprar cotas (com créditos), vender ou ver suas posições.
        </div>
      )}

      <div style={{ padding: "0.75rem 1rem", background: "#1e293b", fontSize: "0.8rem", color: "#64748b" }}>
        Rateio mensal: receita (YouTube + TrustBank) é dividida entre detentores de cotas. 20% do sistema; o restante proporcional às suas shares. Gráfico e CPM em breve.
      </div>
    </div>
  );
}
