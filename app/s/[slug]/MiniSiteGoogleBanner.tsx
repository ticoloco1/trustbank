"use client";

import Link from "next/link";

export default function MiniSiteGoogleBanner({ slug }: { slug: string }) {
  const returnTo = `/s/${encodeURIComponent(slug)}`;
  const authUrl = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div
      style={{
        marginBottom: "1.25rem",
        padding: "12px 16px",
        background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
        textAlign: "center",
      }}
    >
      <span style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 500 }}>
        Sign in with Google to unlock paywall videos and manage your content.
      </span>
      <Link
        href={authUrl}
        style={{
          padding: "10px 20px",
          background: "#fff",
          color: "#1e40af",
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
          fontSize: "0.9rem",
          whiteSpace: "nowrap",
        }}
      >
        Sign in with Google
      </Link>
    </div>
  );
}
