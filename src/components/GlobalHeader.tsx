"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function GlobalHeader() {
  const { items } = useCart();
  const count = items.length;

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1.5rem",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        flexWrap: "wrap",
        gap: "0.75rem",
        borderBottom: "1px solid #334155",
      }}
    >
      <Link href="/" style={{ color: "#f8fafc", textDecoration: "none", fontWeight: 700, fontSize: "1.25rem" }}>
        TrustBank
      </Link>
      <nav style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/slugs"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            background: "#1e3a8a",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
          }}
        >
          Buscar domínios
        </Link>
        <Link
          href="/cart"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: count > 0 ? "#16a34a" : "#334155",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
            border: count > 0 ? "2px solid #22c55e" : "none",
            boxShadow: count > 0 ? "0 2px 8px rgba(22, 163, 74, 0.4)" : "none",
          }}
        >
          <span aria-hidden>Carrinho</span>
          {count > 0 ? (
            <span
              style={{
                background: "#fff",
                color: count > 0 ? "#16a34a" : "#334155",
                borderRadius: "9999px",
                minWidth: "1.35rem",
                height: "1.35rem",
                padding: "0 0.4rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {count}
            </span>
          ) : (
            <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>(0)</span>
          )}
        </Link>
        <Link
          href="/credits"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          Créditos
        </Link>
        <Link href="/slugs" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.95rem" }}>
          Comprar slug
        </Link>
        <Link href="/market" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.95rem" }}>
          Marketplace
        </Link>
        <Link href="/dashboard" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.95rem" }}>
          Dashboard
        </Link>
        <Link href="/site/edit" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.95rem" }}>
          Videos
        </Link>
        <Link
          href="/api/auth/google"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            background: "#1e3a8a",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 600,
            border: "1px solid #2563eb",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Google
        </Link>
      </nav>
    </header>
  );
}
