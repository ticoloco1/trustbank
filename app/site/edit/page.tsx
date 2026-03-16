"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Video = {
  id: string;
  youtube_id: string;
  title: string | null;
  thumbnail_url: string | null;
  paywall_enabled: boolean;
  paywall_price_usdc: string | null;
};

function SiteEditContent() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [videoForm, setVideoForm] = useState({
    youtubeUrl: "",
    paywallEnabled: false,
    paywallPriceUsdc: "",
  });
  const [googleError, setGoogleError] = useState<string | null>(null);

  const { data: googleSession, refetch: refetchGoogle } = useQuery({
    queryKey: ["google-session"],
    queryFn: async () => {
      const r = await fetch("/api/auth/google/session", { credentials: "include" });
      const data = await r.json();
      return data as { user: { id: string; email: string | null } | null };
    },
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["videos", !!googleSession?.user],
    queryFn: async () => {
      const r = await fetch("/api/videos", { credentials: "include" });
      if (!r.ok) return [];
      return r.json() as Promise<Video[]>;
    },
    enabled: !!googleSession?.user,
  });

  const addVideoMutation = useMutation({
    mutationFn: async (payload: typeof videoForm) => {
      const r = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          youtubeUrl: payload.youtubeUrl,
          paywallEnabled: payload.paywallEnabled,
          paywallPriceUsdc: payload.paywallPriceUsdc || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Failed to add video");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      setVideoForm({ youtubeUrl: "", paywallEnabled: false, paywallPriceUsdc: "" });
    },
  });

  const logoutGoogle = async () => {
    await fetch("/api/auth/google/session", { method: "DELETE", credentials: "include" });
    refetchGoogle();
    qc.invalidateQueries({ queryKey: ["videos"] });
  };

  useEffect(() => {
    const err = searchParams.get("google_error");
    if (err) {
      setGoogleError(
        err === "missing_code"
          ? "Google did not return a code. Try again."
          : err === "exchange_failed"
            ? "Failed to sign in. Check Google OAuth settings."
            : "Google sign-in error."
      );
      window.history.replaceState({}, "", "/site/edit");
    }
  }, [searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        color: "#e2e8f0",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: "1.25rem", fontWeight: 700 }}>
            TrustBank
          </Link>
          <Link href="/dashboard" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>
            Dashboard
          </Link>
        </header>

        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Videos &amp; paywall</h1>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          Sign in with Google (your YouTube channel account) to add videos and enable paywall.
        </p>

        {/* Google OAuth — sempre em destaque no topo */}
        {!googleSession?.user ? (
          <section
            style={{
              padding: "1.5rem",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Sign in to manage videos</h2>
            {googleError && (
              <p style={{ color: "#f87171", marginBottom: "0.75rem", fontSize: "0.9rem" }}>{googleError}</p>
            )}
            <a
              href="/api/auth/google?returnTo=%2Fsite%2Fedit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "12px 20px",
                background: "#fff",
                color: "#1f2937",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </a>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#94a3b8" }}>
              Use the Google account that owns your YouTube channel. Only videos you own can have paywall.
            </p>
          </section>
        ) : (
          <section
            style={{
              padding: "1rem",
              background: "rgba(34, 197, 94, 0.1)",
              borderRadius: 8,
              border: "1px solid rgba(34, 197, 94, 0.3)",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>
              Logged in: <strong>{googleSession.user.email || googleSession.user.id}</strong>
            </span>
            <button
              type="button"
              onClick={logoutGoogle}
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.85rem",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: "#e2e8f0",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </section>
        )}

        {/* Lista de vídeos — só quando logado */}
        {googleSession?.user && (
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Your videos</h2>
            {videosLoading ? (
              <p style={{ color: "#94a3b8" }}>Loading…</p>
            ) : videos.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                No videos yet. Add one below (only videos you own on YouTube will appear).
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {videos.map((v) => (
                  <li
                    key={v.id}
                    style={{
                      padding: "1rem",
                      marginBottom: "0.5rem",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {v.thumbnail_url && (
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 6 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{v.title || v.youtube_id}</p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                        {v.paywall_enabled ? `Paywall: ${v.paywall_price_usdc ?? "0"} USDC` : "No paywall"}
                      </p>
                      <Link
                        href={`/v/${v.id}`}
                        style={{ marginTop: "0.5rem", display: "inline-block", fontSize: "0.85rem", color: "#60a5fa" }}
                      >
                        View video page →
                      </Link>
                      <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#7dd3fc", fontWeight: 600 }}>Backlink for your channel</p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>Put this link in your YouTube video description:</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                        <code style={{ fontSize: "0.8rem", background: "rgba(0,0,0,0.2)", padding: "0.25rem 0.5rem", borderRadius: 4, wordBreak: "break-all" }}>
                          {typeof window !== "undefined" ? `${window.location.origin}/v/${v.id}` : `/v/${v.id}`}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            const url = typeof window !== "undefined" ? `${window.location.origin}/v/${v.id}` : "";
                            if (url) navigator.clipboard?.writeText(url).then(() => alert("Link copied!")).catch(() => {});
                          }}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#0e7490", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer" }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Formulário "Enviar embed" / Adicionar vídeo — abaixo dos vídeos, só quando logado */}
        {googleSession?.user ? (
          <section
            style={{
              padding: "1.5rem",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Add video / Send embed</h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
              Paste a YouTube video URL. We verify you own the channel before adding. You can then enable paywall.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!videoForm.youtubeUrl.trim()) return;
                addVideoMutation.mutate(videoForm);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 480 }}
            >
              <input
                placeholder="YouTube video URL"
                value={videoForm.youtubeUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                style={{
                  padding: "12px 14px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 16,
                }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={videoForm.paywallEnabled}
                  onChange={(e) => setVideoForm((f) => ({ ...f, paywallEnabled: e.target.checked }))}
                />
                <span>Enable paywall (charge for access)</span>
              </label>
              {videoForm.paywallEnabled && (
                <input
                  placeholder="Price in USDC (e.g. 5.00)"
                  value={videoForm.paywallPriceUsdc}
                  onChange={(e) => setVideoForm((f) => ({ ...f, paywallPriceUsdc: e.target.value }))}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    width: "12rem",
                  }}
                />
              )}
              <button
                type="submit"
                disabled={addVideoMutation.isPending || !videoForm.youtubeUrl.trim()}
                style={{
                  padding: "12px 20px",
                  background: "#1a73e8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                {addVideoMutation.isPending ? "Verifying owner…" : "Add video"}
              </button>
              {addVideoMutation.isError && (
                <p style={{ color: "#f87171", fontSize: "0.9rem" }}>
                  {(addVideoMutation.error as Error).message}
                </p>
              )}
            </form>
          </section>
        ) : (
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Sign in with Google above to add videos and send embed. You must be logged in to add content.
          </p>
        )}
      </div>
    </main>
  );
}

export default function SiteEditPage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Loading…</main>}>
      <SiteEditContent />
    </Suspense>
  );
}
