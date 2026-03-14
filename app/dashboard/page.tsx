"use client";

import { useAuth } from "@/hooks/useAuth";
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
  const [videoForm, setVideoForm] = useState({ youtubeUrl: "", paywallEnabled: false, paywallPriceUsdc: "" });
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [form, setForm] = useState({
    site_name: "",
    slug: "",
    bio: "",
    layout_columns: 1 as 1 | 2 | 3,
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
          layout_columns: payload.layout_columns ?? 1,
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
      setForm({ site_name: "", slug: "", bio: "", layout_columns: 1, primary_color: "#6366f1", accent_color: "#ec4899", bg_color: "#080810", cotacao_symbol: "", cotacao_label: "" });
    },
  });

  if (loading) return <p style={{ padding: "2rem" }}>Carregando…</p>;
  if (!user && !isAdmin) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <p>Conecte sua carteira (e use uma wallet admin) para acessar o Governance.</p>
        <Link href="/" style={{ color: "#0066cc" }}>← Voltar</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none" }}>← TrustBank</Link>
      </div>
      <h1>Governance — Mini sites</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Crie e edite mini sites. Use <strong>slug</strong> para a URL: /s/<strong>slug</strong>.
        Cotação: use <strong>BTC</strong> ou <strong>ETH</strong> em cotacao_symbol, ou texto em cotacao_label.
      </p>

      <section style={{ marginBottom: "2rem", padding: "1rem", background: "#f6f6f6", borderRadius: 8 }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Criar mini site</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 400 }}
        >
          <input
            placeholder="Nome do site"
            value={form.site_name}
            onChange={(e) => setForm((f) => ({ ...f, site_name: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <input
            placeholder="Slug (ex: meu-site)"
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
                    onClick={() => setForm((f) => ({ ...f, primary_color: t.primary_color, accent_color: t.accent_color, bg_color: t.bg_color }))}
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
            {createMutation.isPending ? "Criando…" : "Criar mini site"}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Mini sites</h2>
        {isLoading ? (
          <p>Carregando…</p>
        ) : miniSites.length === 0 ? (
          <p style={{ color: "#666" }}>Nenhum mini site ainda. Crie um acima.</p>
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
                  {s._count && <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#888" }}>({s._count.ideas} ideias)</span>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {s.slug && (
                    <Link
                      href={`/s/${s.slug}`}
                      style={{ padding: "0.25rem 0.5rem", background: "#eee", borderRadius: 4, textDecoration: "none", color: "#333", fontSize: "0.9rem" }}
                    >
                      Ver
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/${s.id}`}
                    style={{ padding: "0.25rem 0.5rem", background: "#333", color: "#fff", borderRadius: 4, textDecoration: "none", fontSize: "0.9rem" }}
                  >
                    Editar
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
