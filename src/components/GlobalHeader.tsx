"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useCart } from "@/context/CartContext";
import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/market", label: "Marketplace" },
  { href: "/jobs", label: "Jobs" },
  { href: "/slugs", label: "Slugs" },
  { href: "/slugs", label: "Domains", query: "?tab=domains" },
  { href: "/dashboard", label: "Mini Site" },
] as const;

export default function GlobalHeader() {
  const pathname = usePathname() ?? "";
  const { items } = useCart();
  const count = items.length;
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ email: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/google/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.email) setGoogleUser({ email: d.user.email });
        else setGoogleUser(null);
      })
      .catch(() => setGoogleUser(null));
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

        {!googleUser ? (
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
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Login com Google
          </Link>
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
              {googleUser.email?.[0]?.toUpperCase() ?? "A"}
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
                  {googleUser.email}
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
