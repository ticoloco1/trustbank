"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useCart } from "@/context/CartContext";

const BASE = "trustbank.xyz";

type SlugType = "handle" | "company";

type CheckResult = {
  available?: boolean;
  slug?: string;
  slug_type?: string;
  full_url?: string;
  message?: string;
  listing_id?: string;
  amount_usdc?: string;
  tier?: string;
  error?: string;
};

function SlugsContent() {
  const searchParams = useSearchParams();
  const [slugType, setSlugType] = useState<SlugType>("company");
  const [input, setInput] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{ destination_wallet: string; amount_usdc: string } | null>(null);

  const { address, isConnected } = useAccount();
  const { addItem, hasItem } = useCart();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();

  const slugClean = input.trim().toLowerCase().replace(/^@/, "").replace(/^\s*trustbank\.xyz\/[s@]\/?/i, "").replace(/\s/g, "");

  useEffect(() => {
    const q = searchParams.get("slug")?.trim().toLowerCase().replace(/^@/, "");
    if (q && /^[a-z0-9_-]+$/i.test(q)) {
      setInput(q);
      setCheckResult(null);
      const type = (searchParams.get("type") || "company") as SlugType;
      setSlugType(type === "handle" ? "handle" : "company");
      fetch(`/api/slugs/check?slug=${encodeURIComponent(q)}&type=${type}`)
        .then((r) => r.json())
        .then((data: CheckResult) => setCheckResult(data))
        .catch(() => setCheckResult({ available: false, error: "Check failed" }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!checkResult?.available || !checkResult?.slug) {
      setPaymentConfig(null);
      return;
    }
    const refId = slugType === "handle" ? checkResult.slug : checkResult.slug;
    fetch(`/api/payments/config?type=SLUG_CLAIM&reference_id=${encodeURIComponent(refId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data ? setPaymentConfig({ destination_wallet: data.destination_wallet, amount_usdc: data.amount_usdc }) : setPaymentConfig(null))
      .catch(() => setPaymentConfig(null));
  }, [checkResult?.available, checkResult?.slug, checkResult?.amount_usdc, slugType]);

  const handleCheck = async () => {
    if (!slugClean) return;
    setChecking(true);
    setCheckResult(null);
    setPayError(null);
    try {
      const r = await fetch(`/api/slugs/check?slug=${encodeURIComponent(slugClean)}&type=${slugType}`);
      const data = (await r.json()) as CheckResult;
      setCheckResult(data);
    } catch {
      setCheckResult({ available: false, error: "Check failed" });
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!slugClean || !checkResult?.available || !txHash.trim()) return;
    if (!address) {
      setPayError("Conecte sua carteira.");
      return;
    }
    setVerifying(true);
    setPayError(null);
    try {
      const r = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SLUG_CLAIM",
          reference_id: slugClean,
          tx_hash: txHash.trim(),
          payer_wallet: address,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Verification failed");
      setClaimSuccess(true);
      setTxHash("");
      setCheckResult(null);
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handlePayWithCard = async () => {
    if (!slugClean || !checkResult?.available) return;
    setPayError(null);
    try {
      const r = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SLUG_CLAIM",
          reference_id: slugClean,
          success_url: typeof window !== "undefined" ? `${window.location.origin}/dashboard?claimed=1` : undefined,
          cancel_url: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || "Checkout failed");
      if (data?.url) window.location.href = data.url;
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  const displayUrl = `${BASE}/@${(slugClean || "...").replace(/^@/, "")}`;
  const amountUsdc = paymentConfig?.amount_usdc ?? checkResult?.amount_usdc ?? "12.90";
  const refForCart = slugClean;

  return (
    <main style={{ minHeight: "100vh", fontFamily: "system-ui", background: "#0f172a", color: "#e2e8f0", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "1.2rem" }}>TrustBank</Link>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/cart" style={{ color: "#86efac", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Carrinho</Link>
            <Link href="/market" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>Marketplace</Link>
            <Link href="/dashboard" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>Dashboard</Link>
            <Link href="/auth" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>Entrar com Google</Link>
            {!isConnected ? (
              <button type="button" onClick={() => connect({ connector: connectors[0] })} disabled={isConnectPending}
                style={{ padding: "0.4rem 0.8rem", background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {isConnectPending ? "…" : "Conectar carteira"}
              </button>
            ) : (
              <button type="button" onClick={() => disconnect()}
                style={{ padding: "0.4rem 0.8rem", background: "#334155", color: "#94a3b8", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </button>
            )}
          </div>
        </header>

        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.35rem", textAlign: "center" }}>Escolher slug e plano</h1>
        <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          <strong style={{ color: "#1e3a8a" }}>/@</strong> (handle) ou <strong>/s</strong> (página). Nomes e palavras comuns são <strong style={{ color: "#86efac" }}>grátis</strong>; premium/letras são pagos. Quem já tem mini site pode comprar mais slugs.
        </p>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
          Adicione ao carrinho, pague com cartão ou USDC, ou crie direto com slug gratuito no Dashboard.
        </p>

        {/* Tipo: @ ou /s */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => { setSlugType("handle"); setCheckResult(null); }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: slugType === "handle" ? "#1e3a8a" : "rgba(255,255,255,0.06)",
              color: slugType === "handle" ? "#fff" : "#94a3b8",
              border: `1px solid ${slugType === "handle" ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            /@ Handle
          </button>
          <button
            type="button"
            onClick={() => { setSlugType("company"); setCheckResult(null); }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: slugType === "company" ? "#1e3a8a" : "rgba(255,255,255,0.06)",
              color: slugType === "company" ? "#fff" : "#94a3b8",
              border: `1px solid ${slugType === "company" ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            /s Página
          </button>
        </div>

        {/* Busca */}
        <div style={{ display: "flex", alignItems: "stretch", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", padding: "0 12px", background: "rgba(255,255,255,0.06)", borderRadius: 8, color: "#94a3b8", fontSize: 14 }}>
            {slugType === "handle" ? `${BASE}/@` : `${BASE}/s/`}
          </span>
          <input
            type="text"
            placeholder={slugType === "handle" ? "seu-handle" : "sua-pagina"}
            value={input.replace(/^@/, "").replace(/^trustbank\.xyz\/[s@]\/?/i, "")}
            onChange={(e) => setInput(e.target.value.replace(/\s/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            style={{
              flex: "1 1 180px",
              minWidth: 140,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 15,
            }}
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!slugClean || checking}
            style={{
              padding: "10px 18px",
              background: "#0d9488",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {checking ? "…" : "Buscar"}
          </button>
        </div>

        {payError && <p style={{ color: "#f87171", marginBottom: "0.75rem", fontSize: 14 }}>{payError}</p>}

        {claimSuccess && (
          <div style={{ padding: "1rem", background: "rgba(34,197,94,0.2)", borderRadius: 10, marginBottom: "1rem" }}>
            <p style={{ color: "#86efac", margin: 0 }}>Slug registrado. Crie seu mini site no Dashboard.</p>
            <p style={{ color: "#94a3b8", margin: "0.35rem 0 0", fontSize: "0.85rem" }}>Se registrou um handle (/@), use <strong>@nome</strong> no campo slug ao criar o mini site.</p>
            <Link href="/dashboard" style={{ color: "#67e8f9", marginTop: "0.5rem", display: "inline-block" }}>Ir ao Dashboard →</Link>
          </div>
        )}

        {checkResult && !checkResult.available && (
          <div style={{ padding: "1rem", background: "rgba(248,113,113,0.12)", borderRadius: 10, marginBottom: "1rem", border: "1px solid rgba(248,113,113,0.3)" }}>
            <p style={{ color: "#fca5a5", margin: 0 }}>{checkResult.message || checkResult.error}</p>
            {checkResult.listing_id && (
              <Link href={`/market/${checkResult.listing_id}`} style={{ color: "#60a5fa", marginTop: "0.5rem", display: "inline-block" }}>
                Comprar no marketplace →
              </Link>
            )}
          </div>
        )}

        {checkResult?.available && checkResult.slug && (
          <div style={{ padding: "1.25rem", background: checkResult.tier === "default" ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 12, marginBottom: "1rem" }}>
            <p style={{ color: "#86efac", margin: "0 0 0.5rem", fontWeight: 600 }}>
              Disponível: {slugType === "handle" ? <span style={{ color: "#1e3a8a" }}>{displayUrl}</span> : displayUrl}
              {checkResult.tier === "default" && (
                <span style={{ marginLeft: "0.5rem", fontSize: 12, background: "#166534", color: "#86efac", padding: "2px 8px", borderRadius: 6 }}>Grátis</span>
              )}
            </p>

            {checkResult.tier === "default" ? (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ color: "#94a3b8", marginBottom: "0.75rem", fontSize: 14 }}>
                  Slug gratuito (nome, sobrenome ou palavra comum). Crie seu mini site sem pagar por este slug.
                </p>
                <Link
                  href={`/dashboard?slug=${encodeURIComponent(slugType === "handle" ? `@${refForCart}` : refForCart)}`}
                  style={{
                    display: "inline-block",
                    padding: "10px 18px",
                    background: "#16a34a",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  Criar mini site com este slug →
                </Link>
                <p style={{ color: "#64748b", marginTop: "0.75rem", fontSize: 12 }}>
                  No Dashboard, o slug já virá preenchido. Conecte a carteira e clique em &quot;Criar mini site&quot;.
                </p>
              </div>
            ) : (
              <>
                <p style={{ color: "#94a3b8", marginBottom: "1rem", fontSize: 14 }}>
                  Valor: <strong style={{ color: "#fff" }}>${amountUsdc} USDC</strong> (única vez; renovação anual após 1 ano).
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    {!hasItem("SLUG_CLAIM", refForCart) && (
                      <button
                        type="button"
                        onClick={() => addItem({ type: "SLUG_CLAIM", reference_id: refForCart, label: `Slug: ${slugType === "handle" ? `@${refForCart}` : refForCart}`, amount_usdc: amountUsdc })}
                        style={{ padding: "8px 14px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                      >
                        Adicionar ao carrinho
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasItem("SLUG_CLAIM", refForCart)) addItem({ type: "SLUG_CLAIM", reference_id: refForCart, label: `Slug: ${slugType === "handle" ? `@${refForCart}` : refForCart}`, amount_usdc: amountUsdc });
                        window.location.href = "/cart";
                      }}
                      style={{ padding: "8px 14px", background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                    >
                      Comprar agora (ir ao carrinho)
                    </button>
                    <Link href="/cart" style={{ fontSize: 13, color: "#7dd3fc", alignSelf: "center" }}>Ver carrinho</Link>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: "0.35rem" }}>Pagar com carteira (USDC)</p>
                    {paymentConfig?.destination_wallet && (
                      <p style={{ fontSize: 11, color: "#64748b", marginBottom: "0.5rem", wordBreak: "break-all" }}>Envie {amountUsdc} USDC para: {paymentConfig.destination_wallet}</p>
                    )}
                    {!isConnected ? (
                      <p style={{ color: "#fbbf24", fontSize: 13 }}>Conecte a carteira para verificar o pagamento.</p>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Hash da transação (0x...)"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "rgba(0,0,0,0.25)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            marginBottom: "0.5rem",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPayment}
                          disabled={!txHash.trim() || verifying}
                          style={{ padding: "8px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                        >
                          {verifying ? "Verificando…" : "Verificar pagamento e registrar"}
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem" }}>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: "0.35rem" }}>Ou pagar com cartão</p>
                    <button type="button" onClick={handlePayWithCard}
                      style={{ padding: "8px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                      Pagar com cartão
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", marginTop: "1.5rem" }}>
          Palavras como bank, ceo, seo, investment têm preço ou uso restrito. Letras únicas têm preço premium.
        </p>
      </div>
    </main>
  );
}

export default function SlugsPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8" }}>Carregando…</main>}>
      <SlugsContent />
    </Suspense>
  );
}
