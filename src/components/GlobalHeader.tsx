"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useCart } from "@/context/CartContext";
import { useState, useRef, useEffect } from "react";

const NAV_LINKS: { href: string; label: string; query?: string }[] = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/market", label: "Marketplace" },
  { href: "/jobs", label: "Jobs" },
  { href: "/slugs", label: "Slugs" },
  { href: "/slugs", label: "Domains", query: "?tab=domains" },
  { href: "/dashboard", label: "Mini Site" },
];

export default function GlobalHeader() {
  const pathname = usePathname() ?? "";
  const { items } = useCart();
  const count = items.length;
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.email || d?.user?.id) setSessionUser({ id: d.user.id, email: d.user.email ?? null });
        else setSessionUser(null);
      })
      .catch(() => setSessionUser(null));
  }, []);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const connector = connectors[0];

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.6rem 1.5rem",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        flexWrap: "wrap",
        gap: "0.75rem",
        borderBottom: "1px solid #334155",
      }}
    >
      <Link href="/" style={{ color: "#f8fafc", textDecoration: "none", fontWeight: 700, fontSize: "1.2rem" }}>
        TrustBank
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
        {NAV_LINKS.map(({ href, label, query }) => {
          const to = query ? `${href}${query}` : href;
          const active = pathname === href || (pathname.startsWith("/dashboard") && label === "Mini Site") || (pathname === "/how-it-works" && label === "How It Works") || (pathname.startsWith("/market") && label === "Marketplace") || (pathname === "/jobs" && label === "Jobs") || (pathname === "/slugs" && (label === "Slugs" || label === "Domains"));
          return (
            <Link
              key={label}
              href={to}
              style={{
                color: active ? "#f97316" : "#94a3b8",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                padding: "0.4rem 0.65rem",
                borderRadius: 6,
                borderBottom: active ? "2px solid #f97316" : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link
          href="/cart"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            background: count > 0 ? "#16a34a" : "#334155",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Carrinho {count > 0 ? `(${count})` : ""}
        </Link>

        {!isConnected ? (
          <button
            type="button"
            onClick={() => connector && connect({ connector })}
            disabled={isConnectPending || !connector}
            style={{
              padding: "0.45rem 0.9rem",
              background: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: isConnectPending || !connector ? "not-allowed" : "pointer",
              opacity: isConnectPending ? 0.8 : 1,
            }}
          >
            {isConnectPending ? "Conectando…" : "Connect Wallet"}
          </button>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }} title={address}>
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
        )}

        {!sessionUser ? (
          <>
            <Link
              href="/auth"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.9rem",
                background: "#1e3a8a",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Entrar
            </Link>
            <Link
              href="/auth?tab=register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.9rem",
                background: "#334155",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Criar conta
            </Link>
          </>
        ) : (
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#334155",
                color: "#f97316",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Menu usuário"
            >
              {sessionUser.email?.[0]?.toUpperCase() ?? "A"}
            </button>
            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: "0.5rem 0",
                  minWidth: 200,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  zIndex: 50,
                }}
              >
                <p style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "#94a3b8", margin: 0, borderBottom: "1px solid #334155" }}>
                  {sessionUser.email ?? "Conta"}
                </p>
                <Link href="/dashboard" style={{ display: "block", padding: "0.5rem 0.75rem", color: "#e2e8f0", textDecoration: "none", fontSize: "0.9rem" }}>Mini Site</Link>
                <Link href="/auth/signout" onClick={() => setUserMenuOpen(false)} style={{ display: "block", padding: "0.5rem 0.75rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>Sair</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
