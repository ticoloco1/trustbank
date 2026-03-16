"use client";

import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect } from "react";

function DepositAddress() {
  const { data } = useQuery({
    queryKey: ["credits-deposit-address"],
    queryFn: async () => {
      const r = await fetch("/api/credits/deposit-address");
      if (!r.ok) return null;
      return r.json() as Promise<{ address: string }>;
    },
  });
  if (!data?.address) return null;
  const copy = () => navigator.clipboard.writeText(data.address);
  return (
    <p style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
      Carteira: <code style={{ background: "#e2e8f0", padding: "0.2rem 0.4rem", borderRadius: 4 }}>{data.address}</code>
      <button type="button" onClick={copy} style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>Copiar</button>
    </p>
  );
}

export default function CreditsPage() {
  const { address, isConnected } = useAccount();
  const qc = useQueryClient();
  const [txHash, setTxHash] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccessTx, setWithdrawSuccessTx] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["credits-summary", address ?? ""],
    queryFn: async () => {
      if (!address) return null;
      const r = await fetch(`/api/credits/summary?wallet=${encodeURIComponent(address)}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!address,
  });

  const { data: txs = [], isLoading: txsLoading } = useQuery({
    queryKey: ["credits-transactions", address ?? ""],
    queryFn: async () => {
      if (!address) return [];
      const r = await fetch(`/api/credits/transactions?wallet=${encodeURIComponent(address)}&limit=50`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!address,
  });

  // Sincronização automática de depósitos ao abrir a página (detecta USDC enviado à plataforma)
  useEffect(() => {
    if (!address) return;
    fetch("/api/credits/sync-deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.credited > 0) {
          qc.invalidateQueries({ queryKey: ["credits-summary", address] });
          qc.invalidateQueries({ queryKey: ["credits-transactions", address] });
        }
      })
      .catch(() => {});
  }, [address]);

  const syncDepositsMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/credits/sync-deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao sincronizar");
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits-summary", address] });
      qc.invalidateQueries({ queryKey: ["credits-transactions", address] });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/credits/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, tx_hash: txHash.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha no depósito");
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits-summary", address] });
      qc.invalidateQueries({ queryKey: ["credits-transactions", address] });
      setTxHash("");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/credits/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, amount_usdc: withdrawAmount.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha na retirada");
      return j;
    },
    onSuccess: (data: { tx_hash?: string }) => {
      qc.invalidateQueries({ queryKey: ["credits-summary", address] });
      qc.invalidateQueries({ queryKey: ["credits-transactions", address] });
      setWithdrawAmount("");
      if (data?.tx_hash) setWithdrawSuccessTx(data.tx_hash);
    },
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Créditos TrustBank</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        1 crédito = 1 USDC. Deposite USDC para obter créditos; use créditos para comprar shares de vídeos. Venda shares e receba em créditos; troque créditos por USDC na retirada.
      </p>

      {!isConnected || !address ? (
        <p style={{ padding: "1rem", background: "#fef3c7", borderRadius: 8, color: "#92400e" }}>
          Conecte sua carteira para ver saldo, depositar e retirar.
        </p>
      ) : (
        <>
          <section style={{ marginBottom: "2rem", padding: "1.25rem", background: "#f0fdf4", borderRadius: 12, border: "1px solid #86efac" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Saldo</h2>
            {summaryLoading ? (
              <p style={{ margin: 0, color: "#64748b" }}>Carregando…</p>
            ) : (
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#166534" }}>
                ${summary?.balance_usdc ?? "0.00"}
              </p>
            )}
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#15803d" }}>
              Total depositado: ${summary?.total_deposited ?? "0.00"} · Total retirado: ${summary?.total_withdrawn ?? "0.00"}
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Depositar</h2>
            <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Envie USDC (Polygon ou Ethereum) para a carteira abaixo. Os depósitos são creditados automaticamente ao abrir esta página. Se não aparecer, use &quot;Atualizar depósitos&quot; ou informe o hash da transação.
            </p>
            <DepositAddress />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => syncDepositsMutation.mutate()}
                disabled={syncDepositsMutation.isPending}
                style={{ padding: "0.5rem 1rem", background: "#0f766e", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
              >
                {syncDepositsMutation.isPending ? "Sincronizando…" : "Atualizar depósitos"}
              </button>
              {syncDepositsMutation.isSuccess && ((syncDepositsMutation.data as { credited?: number } | undefined)?.credited ?? 0) > 0 && (
                <span style={{ fontSize: "0.9rem", color: "#15803d" }}>{(syncDepositsMutation.data as { credited?: number })?.credited ?? 0} depósito(s) creditado(s).</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                placeholder="0x... (tx hash — opcional)"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                style={{ padding: "0.5rem", width: 400, maxWidth: "100%", border: "1px solid #cbd5e1", borderRadius: 8 }}
              />
              <button
                type="button"
                onClick={() => depositMutation.mutate()}
                disabled={!txHash.trim() || depositMutation.isPending}
                style={{ padding: "0.5rem 1rem", background: "#0d9488", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
              >
                {depositMutation.isPending ? "Verificando…" : "Confirmar depósito"}
              </button>
            </div>
            {depositMutation.isError && <p style={{ marginTop: "0.5rem", color: "#dc2626", fontSize: "0.9rem" }}>{(depositMutation.error as Error).message}</p>}
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Retirar</h2>
            <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Converta créditos em USDC. O valor é enviado automaticamente para sua carteira (Polygon).
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Valor (ex: 10.00)"
                value={withdrawAmount}
                onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawSuccessTx(null); }}
                style={{ padding: "0.5rem", width: 120, border: "1px solid #cbd5e1", borderRadius: 8 }}
              />
              <button
                type="button"
                onClick={() => withdrawMutation.mutate()}
                disabled={!withdrawAmount.trim() || withdrawMutation.isPending}
                style={{ padding: "0.5rem 1rem", background: "#1e3a8a", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
              >
                {withdrawMutation.isPending ? "Enviando…" : "Retirar USDC"}
              </button>
            </div>
            {withdrawSuccessTx && (
              <p style={{ marginTop: "0.5rem", color: "#15803d", fontSize: "0.9rem" }}>
                USDC enviado. Tx: <a href={`https://polygonscan.com/tx/${withdrawSuccessTx}`} target="_blank" rel="noopener noreferrer" style={{ color: "#0d9488" }}>{withdrawSuccessTx.slice(0, 10)}…</a>
              </p>
            )}
            {withdrawMutation.isError && <p style={{ marginTop: "0.5rem", color: "#dc2626", fontSize: "0.9rem" }}>{(withdrawMutation.error as Error).message}</p>}
          </section>

          {summary?.shares && summary.shares.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Minhas cotas (shares)</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {summary.shares.map((s: { video_id: string; video_title: string | null; ticker: string | null; shares: number }) => (
                  <li key={s.video_id} style={{ padding: "0.75rem", marginBottom: "0.5rem", background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span>{s.video_title || s.video_id} {s.ticker && <span style={{ color: "#64748b" }}>({s.ticker})</span>}</span>
                    <span style={{ fontWeight: 600 }}>{s.shares.toLocaleString()} shares</span>
                    <Link href={`/v/${s.video_id}`} style={{ fontSize: "0.9rem", color: "#0d9488" }}>Ver vídeo</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Histórico</h2>
            {txsLoading ? (
              <p style={{ color: "#64748b" }}>Carregando…</p>
            ) : txs.length === 0 ? (
              <p style={{ color: "#64748b" }}>Nenhuma transação ainda.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {txs.map((t: { id: string; type: string; amount_usdc: string; balance_after: string | null; created_at: string }) => (
                  <li key={t.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.25rem" }}>
                    <span>{t.type}</span>
                    <span style={t.amount_usdc.startsWith("-") ? { color: "#dc2626" } : { color: "#16a34a" }}>{t.amount_usdc} USDC</span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{new Date(t.created_at).toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none" }}>← Voltar</Link>
      </p>
    </div>
  );
}
