"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MINISITE_THEMES } from "@/lib/minisite-themes";

type MiniSite = {
  id: string;
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  layout_columns: number | null;
  primary_color: string | null;
  accent_color: string | null;
  bg_color: string | null;
  cotacao_symbol: string | null;
  cotacao_label: string | null;
  _count?: { ideas: number };
};

type Video = {
  id: string;
  youtube_id: string;
  title: string | null;
  thumbnail_url: string | null;
  paywall_enabled: boolean;
  paywall_price_usdc: string | null;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const { user, isAdmin, loading } = useAuth();
  const { address } = useAccount();
  const [videoForm, setVideoForm] = useState({ youtubeUrl: "", paywallEnabled: false, paywallPriceUsdc: "" });
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [standaloneSlugForm, setStandaloneSlugForm] = useState({
    slug_value: "",
    slug_type: "company" as "company" | "handle",
    price_usdc: "12.90",
    listing_type: "sale" as "sale" | "auction",
    end_at: "",
    min_bid_usdc: "1",
  });
  const [apiKeysForm, setApiKeysForm] = useState({
    google_client_id: "",
    google_client_secret: "",
    youtube_api_key: "",
  });
  const [form, setForm] = useState({
    site_name: "",
    slug: "",
    bio: "",
    template: "default" as "default" | "investor",
    layout_columns: 1 as 1 | 2 | 3,
    theme: "",
    primary_color: "#6366f1",
    accent_color: "#ec4899",
    bg_color: "#080810",
    cotacao_symbol: "",
    cotacao_label: "",
  });
  const qc = useQueryClient();

  const { data: miniSites = [], isLoading } = useQuery({
    queryKey: ["mini-sites"],
    queryFn: async () => {
      const r = await fetch("/api/mini-sites");
      if (!r.ok) return [];
      return r.json() as Promise<MiniSite[]>;
    },
  });

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

  const { data: apiKeysStatus, refetch: refetchApiKeys } = useQuery({
    queryKey: ["admin-api-keys", address, isAdmin],
    queryFn: async () => {
      const r = await fetch(`/api/admin/keys?wallet=${encodeURIComponent(address ?? "")}`);
      if (!r.ok) throw new Error("Forbidden");
      return r.json() as Promise<{
        google_client_id_set: boolean;
        google_client_secret_set: boolean;
        youtube_api_key_set: boolean;
        google_client_id: string;
        google_client_secret: string;
        youtube_api_key: string;
      }>;
    },
    enabled: !!address && !!isAdmin,
  });

  const saveApiKeysMutation = useMutation({
    mutationFn: async (payload: { google_client_id?: string; google_client_secret?: string; youtube_api_key?: string }) => {
      const body: { admin_wallet: string; google_client_id?: string; google_client_secret?: string; youtube_api_key?: string } = {
        admin_wallet: address!,
      };
      if (payload.google_client_id?.trim()) body.google_client_id = payload.google_client_id.trim();
      if (payload.google_client_secret?.trim()) body.google_client_secret = payload.google_client_secret.trim();
      if (payload.youtube_api_key?.trim()) body.youtube_api_key = payload.youtube_api_key.trim();
      const r = await fetch("/api/admin/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to save");
      return data;
    },
    onSuccess: () => {
      refetchApiKeys();
      setApiKeysForm({ google_client_id: "", google_client_secret: "", youtube_api_key: "" });
    },
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
      if (!r.ok) throw new Error(data.message || data.error || "Falha ao adicionar vídeo");
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
      setGoogleError(err === "missing_code" ? "Resposta do Google sem código." : err === "exchange_failed" ? "Falha ao trocar código por token. Tente de novo." : err);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const r = await fetch("/api/mini-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id ?? "anonymous",
          site_name: payload.site_name || null,
          slug: payload.slug || null,
          bio: payload.bio || null,
          template: payload.template ?? "default",
          layout_columns: payload.layout_columns ?? 1,
          theme: payload.theme || null,
          primary_color: payload.primary_color || null,
          accent_color: payload.accent_color || null,
          bg_color: payload.bg_color || null,
          cotacao_symbol: payload.cotacao_symbol || null,
          cotacao_label: payload.cotacao_label || null,
        }),
      });
      if (!r.ok) throw new Error("Falha ao criar");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mini-sites"] });
      setForm({ site_name: "", slug: "", bio: "", template: "default", layout_columns: 1, theme: "", primary_color: "#6366f1", accent_color: "#ec4899", bg_color: "#080810", cotacao_symbol: "", cotacao_label: "" });
    },
  });

  const listStandaloneSlugMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/slugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug_value: standaloneSlugForm.slug_type === "handle" ? `@${standaloneSlugForm.slug_value.replace(/^@/, "")}` : standaloneSlugForm.slug_value.replace(/^@/, ""),
          slug_type: standaloneSlugForm.slug_type,
          seller_wallet: address?.toLowerCase(),
          price_usdc: standaloneSlugForm.price_usdc,
          listing_type: standaloneSlugForm.listing_type,
          end_at: standaloneSlugForm.listing_type === "auction" && standaloneSlugForm.end_at ? standaloneSlugForm.end_at : undefined,
          min_bid_usdc: standaloneSlugForm.listing_type === "auction" ? standaloneSlugForm.min_bid_usdc : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Failed to list");
      return data;
    },
    onSuccess: () => {
      setStandaloneSlugForm((f) => ({ ...f, slug_value: "", price_usdc: "", end_at: "" }));
    },
  });

  if (loading) return <p style={{ padding: "2rem" }}>Loading…</p>;
  if (!user && !isAdmin) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <p>Connect your wallet (admin) to access the dashboard.</p>
        <Link href="/" style={{ color: "#0066cc" }}>← Back</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>← Home</Link>
      </div>
      <h1>Dashboard — Mini sites</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Create and edit mini sites. Use <strong>slug</strong> for the URL: /s/<strong>slug</strong>.
        <Link href="/market" style={{ marginLeft: "0.5rem", color: "#0066cc" }}>Slug marketplace →</Link>
      </p>

      <section style={{ marginBottom: "2rem", padding: "1rem", background: "#f6f6f6", borderRadius: 8 }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Create mini site</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 400 }}
        >
          <input
            placeholder="Site name"
            value={form.site_name}
            onChange={(e) => setForm((f) => ({ ...f, site_name: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <input
            placeholder="Slug (e.g. my-site)"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={2}
            style={{ padding: "0.5rem" }}
          />
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Template</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, template: "default" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: form.template === "default" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: form.template === "default" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Default layout
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, template: "investor" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: form.template === "investor" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: form.template === "investor" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Investor feed (crypto, NFTs, feed)
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Layout (colunas)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {([1, 2, 3] as const).map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, layout_columns: cols }))}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: 6,
                    border: form.layout_columns === cols ? "2px solid #6366f1" : "1px solid #ccc",
                    background: form.layout_columns === cols ? "#eef2ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  {cols} coluna{cols > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Cores e temas</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {MINISITE_THEMES.map((t) => {
                const isLight = ["#f9fafb", "#eff6ff", "#fef2f2", "#fefce8", "#f5f3ff", "#faf5ff", "#f0fdf4", "#ecfdf5", "#eef2ff", "#fff7ed", "#e5e7eb"].includes(t.primary_color.toLowerCase());
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, theme: t.id, primary_color: t.primary_color, accent_color: t.accent_color, bg_color: t.bg_color }))}
                    title={t.name}
                    style={{
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                      background: t.primary_color,
                      color: isLight ? "#111" : "#fff",
                      border: 0,
                      borderRadius: 4,
                      cursor: "pointer",
                      boxShadow: form.primary_color === t.primary_color ? "0 0 0 2px #333" : "none",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem" }}>Principal</span>
              <input type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
              <span style={{ fontSize: "0.85rem" }}>Destaque</span>
              <input type="color" value={form.accent_color} onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
              <span style={{ fontSize: "0.85rem" }}>Fundo</span>
              <input type="color" value={form.bg_color} onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
            </div>
          </div>
          <input
            placeholder="Cotação: símbolo (BTC ou ETH)"
            value={form.cotacao_symbol}
            onChange={(e) => setForm((f) => ({ ...f, cotacao_symbol: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <input
            placeholder="Ou cotação: texto livre"
            value={form.cotacao_label}
            onChange={(e) => setForm((f) => ({ ...f, cotacao_label: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            style={{ padding: "0.5rem 1rem", background: "#333", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
          >
            {createMutation.isPending ? "Creating…" : "Create mini site"}
          </button>
        </form>
      </section>

      {address && (
        <section style={{ marginBottom: "2rem", padding: "1rem", background: "#eff6ff", borderRadius: 8, border: "1px solid #93c5fd" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>List company / @handle</h2>
          <p style={{ fontSize: "0.9rem", color: "#1e40af", marginBottom: "0.75rem" }}>
            Reserve a slug (e.g. <strong>acme</strong> or <strong>@acme</strong>) and list it for sale or auction. Buyer gets a new mini-site with that slug.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (standaloneSlugForm.slug_value.trim() && standaloneSlugForm.price_usdc) listStandaloneSlugMutation.mutate();
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 400 }}
          >
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                placeholder="Slug (e.g. acme)"
                value={standaloneSlugForm.slug_value}
                onChange={(e) => setStandaloneSlugForm((f) => ({ ...f, slug_value: e.target.value.replace(/\s/g, "") }))}
                style={{ padding: "0.5rem", flex: 1 }}
              />
              <label style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                <input type="radio" checked={standaloneSlugForm.slug_type === "company"} onChange={() => setStandaloneSlugForm((f) => ({ ...f, slug_type: "company" }))} /> /company
              </label>
              <label style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                <input type="radio" checked={standaloneSlugForm.slug_type === "handle"} onChange={() => setStandaloneSlugForm((f) => ({ ...f, slug_type: "handle" }))} /> @handle
              </label>
            </div>
            <input
              placeholder="12.90 (default)"
              value={standaloneSlugForm.price_usdc}
              onChange={(e) => setStandaloneSlugForm((f) => ({ ...f, price_usdc: e.target.value }))}
              style={{ padding: "0.5rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem" }}><input type="radio" checked={standaloneSlugForm.listing_type === "sale"} onChange={() => setStandaloneSlugForm((f) => ({ ...f, listing_type: "sale" }))} /> Sale</label>
              <label style={{ fontSize: "0.9rem" }}><input type="radio" checked={standaloneSlugForm.listing_type === "auction"} onChange={() => setStandaloneSlugForm((f) => ({ ...f, listing_type: "auction" }))} /> Auction</label>
            </div>
            {standaloneSlugForm.listing_type === "auction" && (
              <>
                <input type="datetime-local" value={standaloneSlugForm.end_at} onChange={(e) => setStandaloneSlugForm((f) => ({ ...f, end_at: e.target.value }))} style={{ padding: "0.5rem" }} />
                <input placeholder="Min bid increment (USDC)" value={standaloneSlugForm.min_bid_usdc} onChange={(e) => setStandaloneSlugForm((f) => ({ ...f, min_bid_usdc: e.target.value }))} style={{ padding: "0.5rem" }} />
              </>
            )}
            <button type="submit" disabled={listStandaloneSlugMutation.isPending || !standaloneSlugForm.slug_value.trim() || !standaloneSlugForm.price_usdc} style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" }}>
              {listStandaloneSlugMutation.isPending ? "Listing…" : "List on marketplace"}
            </button>
          </form>
        </section>
      )}

      {isAdmin && address && (
        <section style={{ marginBottom: "2rem", padding: "1rem", background: "#fefce8", borderRadius: 8, border: "1px solid #eab308" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>API keys (admin)</h2>
          <p style={{ fontSize: "0.9rem", color: "#713f12", marginBottom: "1rem" }}>
            Configure Google OAuth and YouTube API here. Values are stored in the database and override environment variables. Leave a field blank to keep the current value.
          </p>
          {apiKeysStatus && (
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.75rem" }}>
              Status: Google Client ID {apiKeysStatus.google_client_id_set ? "✓ set" : "— not set"} · Client Secret {apiKeysStatus.google_client_secret_set ? "✓ set" : "— not set"} · YouTube API Key {apiKeysStatus.youtube_api_key_set ? "✓ set" : "— not set"}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!apiKeysForm.google_client_id.trim() && !apiKeysForm.google_client_secret.trim() && !apiKeysForm.youtube_api_key.trim()) return;
              saveApiKeysMutation.mutate(apiKeysForm);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 520 }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: 600 }}>Google Client ID</label>
              <input
                type="password"
                placeholder={apiKeysStatus?.google_client_id_set ? "•••••••• (enter new to replace)" : "Paste Client ID"}
                value={apiKeysForm.google_client_id}
                onChange={(e) => setApiKeysForm((f) => ({ ...f, google_client_id: e.target.value }))}
                style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem" }}
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: 600 }}>Google Client Secret</label>
              <input
                type="password"
                placeholder={apiKeysStatus?.google_client_secret_set ? "•••••••• (enter new to replace)" : "Paste Client Secret"}
                value={apiKeysForm.google_client_secret}
                onChange={(e) => setApiKeysForm((f) => ({ ...f, google_client_secret: e.target.value }))}
                style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem" }}
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: 600 }}>YouTube API Key</label>
              <input
                type="password"
                placeholder={apiKeysStatus?.youtube_api_key_set ? "•••••••• (enter new to replace)" : "Paste YouTube API Key"}
                value={apiKeysForm.youtube_api_key}
                onChange={(e) => setApiKeysForm((f) => ({ ...f, youtube_api_key: e.target.value }))}
                style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace", fontSize: "0.9rem" }}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={saveApiKeysMutation.isPending || (!apiKeysForm.google_client_id.trim() && !apiKeysForm.google_client_secret.trim() && !apiKeysForm.youtube_api_key.trim())}
              style={{ padding: "0.5rem 1rem", background: "#ca8a04", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" }}
            >
              {saveApiKeysMutation.isPending ? "Saving…" : "Save keys"}
            </button>
            {saveApiKeysMutation.isError && (
              <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{(saveApiKeysMutation.error as Error).message}</p>
            )}
            {saveApiKeysMutation.isSuccess && (
              <p style={{ color: "#15803d", fontSize: "0.9rem" }}>Keys updated. Login and YouTube features will use these values.</p>
            )}
          </form>
        </section>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Mini sites</h2>
        {isLoading ? (
          <p>Loading…</p>
        ) : miniSites.length === 0 ? (
          <p style={{ color: "#666" }}>No mini sites yet. Create one above.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {miniSites.map((s) => (
              <li
                key={s.id}
                style={{
                  padding: "1rem",
                  marginBottom: "0.5rem",
                  background: "#f9f9f9",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <strong>{s.site_name || s.slug || s.id.slice(0, 8)}</strong>
                  {s.slug && (
                    <span style={{ marginLeft: "0.5rem", color: "#666" }}>/s/{s.slug}</span>
                  )}
                  {s._count && <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#888" }}>({s._count.ideas} ideas)</span>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {s.slug && (
                    <Link
                      href={`/s/${s.slug}`}
                      style={{ padding: "0.25rem 0.5rem", background: "#eee", borderRadius: 4, textDecoration: "none", color: "#333", fontSize: "0.9rem" }}
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/${s.id}`}
                    style={{ padding: "0.25rem 0.5rem", background: "#333", color: "#fff", borderRadius: 4, textDecoration: "none", fontSize: "0.9rem" }}
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ padding: "1rem", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Vídeos e paywall (YouTube)</h2>
        <p style={{ fontSize: "0.9rem", color: "#0c4a6e", fontWeight: 600, marginBottom: "0.5rem" }}>
          Paywall é exclusivo: use apenas o login com Google abaixo. Não há outra forma de ativar paywall.
        </p>
        {googleError && (
          <p style={{ padding: "0.5rem", marginBottom: "0.75rem", background: "#fef2f2", color: "#b91c1c", borderRadius: 4, fontSize: "0.9rem" }}>
            {googleError}
          </p>
        )}
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
          Só vídeos que você comprovar ser dono (conta Google do canal) aparecem aqui e podem ter paywall.
        </p>
        {!googleSession?.user ? (
          <div>
            <a
              href="/api/auth/google"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "#1a73e8",
                color: "#fff",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Entrar com Google
            </a>
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Use a conta do canal do YouTube para adicionar vídeos e ativar paywall.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.9rem" }}>Conectado: <strong>{googleSession.user.email || googleSession.user.id}</strong></span>
              <button
                type="button"
                onClick={logoutGoogle}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#eee", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
              >
                Sair
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!videoForm.youtubeUrl.trim()) return;
                addVideoMutation.mutate(videoForm);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 480, marginBottom: "1.5rem" }}
            >
              <input
                placeholder="URL do vídeo (YouTube)"
                value={videoForm.youtubeUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                style={{ padding: "0.5rem" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={videoForm.paywallEnabled}
                  onChange={(e) => setVideoForm((f) => ({ ...f, paywallEnabled: e.target.checked }))}
                />
                <span>Ativar paywall (cobrar por acesso)</span>
              </label>
              {videoForm.paywallEnabled && (
                <input
                  placeholder="Preço em USDC (ex: 5.00)"
                  value={videoForm.paywallPriceUsdc}
                  onChange={(e) => setVideoForm((f) => ({ ...f, paywallPriceUsdc: e.target.value }))}
                  style={{ padding: "0.5rem", width: "12rem" }}
                />
              )}
              <button
                type="submit"
                disabled={addVideoMutation.isPending}
                style={{ padding: "0.5rem 1rem", background: "#1a73e8", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" }}
              >
                {addVideoMutation.isPending ? "Verificando dono…" : "Adicionar vídeo"}
              </button>
              {addVideoMutation.isError && (
                <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{(addVideoMutation.error as Error).message}</p>
              )}
            </form>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Seus vídeos</h3>
            {videosLoading ? (
              <p>Carregando…</p>
            ) : videos.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>Nenhum vídeo ainda. Adicione um acima (só aparecem vídeos que você é dono no YouTube).</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {videos.map((v) => (
                  <li
                    key={v.id}
                    style={{
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                      background: "#fff",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {v.thumbnail_url && (
                      <img src={v.thumbnail_url} alt="" style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 4 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{v.title || v.youtube_id}</p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                        {v.paywall_enabled ? `Paywall: ${v.paywall_price_usdc ?? "0"} USDC` : "Sem paywall"}
                      </p>
                      <Link
                        href={`/v/${v.youtube_id}`}
                        style={{ marginTop: "0.5rem", display: "inline-block", fontSize: "0.85rem", color: "#1a73e8" }}
                      >
                        Ver página do vídeo →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem" }}>Carregando…</main>}>
      <DashboardContent />
    </Suspense>
  );
}
