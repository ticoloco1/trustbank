"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

const BASE = "trustbank.xyz";

type CheckResult = {
  available?: boolean;
  slug?: string;
  message?: string;
  listing_id?: string;
  error?: string;
  tier?: string;
  amount_usdc?: string;
};

type SlugType = "company" | "handle";

export default function HomeSlugCheck() {
  const [input, setInput] = useState("");
  const [slugType, setSlugType] = useState<SlugType>("company");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [buyNowPending, setBuyNowPending] = useState(false);
  const { addItem, hasItem } = useCart();
  const router = useRouter();

  const slug = input.trim().toLowerCase().replace(/^@/, "").replace(/^\s*trustbank\.xyz\/[s@]\/?/gi, "").replace(/\s/g, "");

  const handleCheck = async () => {
    if (!slug) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`/api/slugs/check?slug=${encodeURIComponent(slug)}&type=${slugType}`);
      const data = (await r.json()) as CheckResult;
      setResult(data);
    } catch {
      setResult({ available: false, error: "Falha ao verificar." });
    } finally {
      setLoading(false);
    }
  };

  const isFree = result?.available && result?.tier === "default";
  const amountUsdc = result?.amount_usdc ?? "12.90";
  const displaySlug = slugType === "handle" ? `@${result?.slug ?? slug}` : (result?.slug ?? slug);
  const displayUrl = slugType === "handle" ? `${BASE}/@${result?.slug ?? slug}` : `${BASE}/s/${result?.slug ?? slug}`;

  return (
    <section
      style={{
        padding: "1.75rem",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: 16,
        border: "2px solid #334155",
        marginBottom: "1.5rem",
        color: "#e2e8f0",
      }}
    >
      <h2 style={{ fontSize: "1.35rem", marginBottom: "0.25rem", color: "#f8fafc" }}>Buscar e comprar domínios / slugs</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "1.25rem" }}>
        Digite o nome que você quer. Pode buscar vários: adicione ao carrinho e pague todos de uma vez no <strong style={{ color: "#86efac" }}>Carrinho</strong>.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setSlugType("company")}
          style={{
            padding: "8px 14px",
            background: slugType === "company" ? "#1e3a8a" : "#334155",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          /s Página
        </button>
        <button
          type="button"
          onClick={() => setSlugType("handle")}
          style={{
            padding: "8px 14px",
            background: slugType === "handle" ? "#1e3a8a" : "#334155",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          /@ Handle
        </button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ padding: "10px 12px", background: "#334155", borderRadius: 8, fontSize: 14, color: "#94a3b8" }}>
          {slugType === "handle" ? `${BASE}/@` : `${BASE}/s/`}
        </span>
        <input
          type="text"
          placeholder={slugType === "handle" ? "seu-handle" : "nome-da-pagina"}
          value={input.replace(/^trustbank\.xyz\/[s@]\/?/gi, "").replace(/^@/, "")}
          onChange={(e) => setInput(e.target.value.replace(/\s/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          style={{
            flex: "1 1 200px",
            minWidth: 160,
            padding: "12px 16px",
            border: "2px solid #475569",
            borderRadius: 8,
            fontSize: 16,
            background: "#1e293b",
            color: "#f8fafc",
          }}
        />
        <button
          type="button"
          onClick={handleCheck}
          disabled={!slug || loading}
          style={{
            padding: "12px 22px",
            background: "#0d9488",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          {loading ? "…" : "Buscar"}
        </button>
      </div>

      {result?.available && result?.slug && (
        <div
          style={{
            padding: "1.25rem",
            background: "rgba(34, 197, 94, 0.15)",
            border: "2px solid rgba(34, 197, 94, 0.5)",
            borderRadius: 12,
            marginBottom: "0.5rem",
          }}
        >
          <p style={{ color: "#86efac", margin: "0 0 0.5rem", fontWeight: 700, fontSize: "1.05rem" }}>
            ✔ Disponível: {displayUrl}
            {isFree && (
              <span style={{ marginLeft: "0.5rem", background: "#166534", color: "#86efac", padding: "4px 10px", borderRadius: 6, fontSize: "0.85rem" }}>
                Grátis
              </span>
            )}
          </p>
          {isFree ? (
            <p style={{ color: "#94a3b8", marginBottom: "1rem", fontSize: "0.95rem" }}>
              Nome comum — crie seu mini site sem pagar por este slug.
            </p>
          ) : (
            <p style={{ color: "#94a3b8", marginBottom: "1rem", fontSize: "0.95rem" }}>
              Valor: <strong style={{ color: "#fff" }}>${amountUsdc} USDC</strong> (uma vez; renovação anual após 1 ano).
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {isFree ? (
                <Link
                  href={`/dashboard?slug=${encodeURIComponent(slugType === "handle" ? `@${result.slug}` : result.slug)}`}
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "#16a34a",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: "1rem",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.4)",
                  }}
                >
                  Criar mini site com este slug →
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasItem("SLUG_CLAIM", result.slug!)) {
                        router.push("/cart");
                        return;
                      }
                      setBuyNowPending(true);
                      addItem({
                        type: "SLUG_CLAIM",
                        reference_id: result.slug!,
                        label: `Slug: ${displaySlug}`,
                        amount_usdc: amountUsdc,
                      });
                      setTimeout(() => {
                        setBuyNowPending(false);
                        router.push("/cart");
                      }, 300);
                    }}
                    disabled={buyNowPending}
                    style={{
                      padding: "12px 24px",
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: "1rem",
                      cursor: buyNowPending ? "wait" : "pointer",
                      boxShadow: "0 2px 8px rgba(22, 163, 74, 0.4)",
                    }}
                  >
                    {buyNowPending ? "…" : `Comprar agora — $${amountUsdc} → Carrinho`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasItem("SLUG_CLAIM", result.slug!)) return;
                      addItem({
                        type: "SLUG_CLAIM",
                        reference_id: result.slug!,
                        label: `Slug: ${displaySlug}`,
                        amount_usdc: amountUsdc,
                      });
                    }}
                    style={{
                      padding: "12px 20px",
                      background: "#334155",
                      color: "#fff",
                      border: "2px solid #475569",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                    }}
                  >
                    Só adicionar ao carrinho
                  </button>
                </>
              )}
              <Link
                href={`/slugs?slug=${encodeURIComponent(result.slug)}&type=${slugType}`}
                style={{
                  display: "inline-block",
                  padding: "10px 18px",
                  background: "transparent",
                  color: "#38bdf8",
                  border: "2px solid #38bdf8",
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                Ver mais opções (cartão / USDC)
              </Link>
            </div>
            <Link href="/cart" style={{ fontSize: "0.95rem", color: "#86efac", fontWeight: 600 }}>Ir ao Carrinho →</Link>
          </div>
        </div>
      )}

      {result && !result.available && (
        <div style={{ padding: "1rem", background: "rgba(248,113,113,0.15)", borderRadius: 8, border: "1px solid rgba(248,113,113,0.4)" }}>
          <p style={{ color: "#fca5a5", margin: 0 }}>{result.message || result.error || "Indisponível."}</p>
          {result.listing_id && (
            <Link href={`/market/${result.listing_id}`} style={{ color: "#7dd3fc", marginTop: "0.5rem", display: "inline-block", fontWeight: 600 }}>
              Comprar no marketplace →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
