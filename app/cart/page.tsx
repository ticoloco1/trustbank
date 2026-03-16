"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function CartContent() {
  const { items, totalUsdc, removeItem, clearCart } = useCart();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const [txHash, setTxHash] = useState("");

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            type: i.type,
            reference_id: i.reference_id,
            label: i.label,
            amount_usdc: i.amount_usdc,
          })),
          success_url: typeof window !== "undefined" ? `${window.location.origin}/cart?success=1` : undefined,
          cancel_url: typeof window !== "undefined" ? `${window.location.origin}/cart` : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) return;
    },
  });

  const verifyCryptoMutation = useMutation({
    mutationFn: async () => {
      if (!txHash.trim()) throw new Error("Enter transaction hash.");
      const r = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CART",
          cart: JSON.stringify(items.map((i) => ({ type: i.type, reference_id: i.reference_id, amount_usdc: i.amount_usdc }))),
          tx_hash: txHash.trim(),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Verification failed");
      return data;
    },
    onSuccess: () => {
      setTxHash("");
      clearCart();
    },
  });

  useEffect(() => {
    if (success && items.length > 0) {
      clearCart();
    }
  }, [success]); // eslint-disable-line react-hooks/exhaustive-deps

  if (success && items.length === 0) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Pagamento concluído</h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Seus itens foram processados. Acesse o Dashboard para criar ou editar seus mini sites.</p>
        <Link href="/" style={{ color: "#0d9488", fontWeight: 600 }}>← Voltar à home</Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Carrinho</h1>
        <p style={{ color: "#64748b", marginBottom: "1rem" }}>Seu carrinho está vazio. Busque domínios/slugs na home ou na página de slugs e adicione ao carrinho para comprar vários de uma vez.</p>
        <Link href="/" style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#16a34a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, marginRight: "0.5rem", marginBottom: "0.5rem" }}>
          Buscar domínios (home)
        </Link>
        <Link href="/slugs" style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#1e3a8a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
          Buscar domínios (página completa)
        </Link>
        <nav style={{ marginTop: "1.5rem" }}>
          <Link href="/market" style={{ marginRight: "1rem", color: "#0d9488" }}>Marketplace</Link>
          <Link href="/dashboard" style={{ color: "#0d9488" }}>Dashboard</Link>
        </nav>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <Link href="/" style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.9rem" }}>← TrustBank</Link>
        <Link href="/slugs" style={{ fontSize: "0.9rem", color: "#1e3a8a", fontWeight: 600, textDecoration: "none" }}>+ Comprar mais domínios</Link>
      </div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Carrinho</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Um único pagamento para todos os itens. Cartão ou USDC.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {items.map((i) => (
          <li
            key={i.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid #e2e8f0",
              background: "#fafafa",
            }}
          >
            <div>
              <strong style={{ fontSize: "0.95rem" }}>{i.label}</strong>
              <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "0.5rem" }}>{i.type}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontWeight: 600 }}>${i.amount_usdc}</span>
              <button
                type="button"
                onClick={() => removeItem(i.id)}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
        Total: ${totalUsdc.toFixed(2)} USDC
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button
          type="button"
          disabled={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
          style={{
            padding: "12px 24px",
            background: "#0d9488",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {checkoutMutation.isPending ? "Redirecionando…" : "Pagar com cartão (Stripe)"}
        </button>
      </div>

      <section style={{ padding: "1rem", background: "#f0fdfa", borderRadius: 8, border: "1px solid #99f6e4", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#0f766e" }}>Pagar com USDC (crypto)</h2>
        <p style={{ fontSize: "0.85rem", color: "#134e4a", marginBottom: "0.75rem" }}>
          Envie exatamente <strong>${totalUsdc.toFixed(2)} USDC</strong> para a carteira da plataforma (Ethereum ou Polygon), depois cole o hash da transação abaixo.
        </p>
        <input
          type="text"
          placeholder="Hash da transação (0x...)"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          style={{ width: "100%", maxWidth: 420, padding: "0.5rem", marginBottom: "0.5rem", border: "1px solid #5eead4", borderRadius: 6, fontSize: "0.9rem" }}
        />
        <button
          type="button"
          disabled={verifyCryptoMutation.isPending || !txHash.trim()}
          onClick={() => verifyCryptoMutation.mutate()}
          style={{ padding: "10px 20px", background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
        >
          {verifyCryptoMutation.isPending ? "Verificando…" : "Verificar pagamento e concluir"}
        </button>
        {verifyCryptoMutation.isSuccess && <p style={{ color: "#15803d", marginTop: "0.5rem", fontSize: 14 }}>Pagamento verificado. Itens processados.</p>}
        {verifyCryptoMutation.isError && <p style={{ color: "#b91c1c", marginTop: "0.5rem", fontSize: 14 }}>{(verifyCryptoMutation.error as Error).message}</p>}
      </section>

      {checkoutMutation.isError && (
        <p style={{ color: "#b91c1c", marginTop: "0.25rem", fontSize: 14 }}>{(checkoutMutation.error as Error).message}</p>
      )}
    </main>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem", fontFamily: "system-ui" }}>Loading cart…</main>}>
      <CartContent />
    </Suspense>
  );
}
