"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MINISITE_THEMES } from "@/lib/minisite-themes";

type Idea = { id: string; title: string | null; content: string | null };
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
  subscription_plan: string | null;
  monthly_price_usdc: string | null;
  next_billing_at: string | null;
  ideas: Idea[];
};

export default function EditMiniSitePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [ideaForm, setIdeaForm] = useState({ title: "", content: "" });

  const { data: site, isLoading } = useQuery({
    queryKey: ["mini-site", id],
    queryFn: async () => {
      const r = await fetch(`/api/mini-sites/${id}`);
      if (!r.ok) return null;
      return r.json() as Promise<MiniSite>;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<MiniSite>) => {
      const r = await fetch(`/api/mini-sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Falha ao atualizar");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mini-site", id] }),
  });

  const addIdeaMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const r = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mini_site_id: id, ...payload }),
      });
      if (!r.ok) throw new Error("Falha ao criar ideia");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mini-site", id] });
      setIdeaForm({ title: "", content: "" });
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const r = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha ao remover");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mini-site", id] }),
  });

  if (loading || (!user && !isAdmin)) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Carregando ou conecte sua carteira admin.</p>
        <Link href="/">← Voltar</Link>
      </main>
    );
  }

  if (isLoading || !site) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Mini site não encontrado ou carregando…</p>
        <Link href="/dashboard">← Dashboard</Link>
      </main>
    );
  }

  const [edit, setEdit] = useState(site);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>← Mini sites</Link>
      </div>
      <h1>Editar: {site.site_name || site.slug || id.slice(0, 8)}</h1>

      <section style={{ marginBottom: "2rem", padding: "1rem", background: "#f6f6f6", borderRadius: 8 }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Dados do mini site</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            placeholder="Nome"
            value={edit.site_name ?? ""}
            onChange={(e) => setEdit((s) => ({ ...s, site_name: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <input
            placeholder="Slug"
            value={edit.slug ?? ""}
            onChange={(e) => setEdit((s) => ({ ...s, slug: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <textarea
            placeholder="Bio"
            value={edit.bio ?? ""}
            onChange={(e) => setEdit((s) => ({ ...s, bio: e.target.value }))}
            rows={2}
            style={{ padding: "0.5rem" }}
          />
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Layout (colunas)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {([1, 2, 3] as const).map((cols) => (
                <button key={cols} type="button" onClick={() => setEdit((s) => ({ ...s, layout_columns: cols }))}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: (edit.layout_columns ?? 1) === cols ? "2px solid #6366f1" : "1px solid #ccc", background: (edit.layout_columns ?? 1) === cols ? "#eef2ff" : "#fff", cursor: "pointer" }}>
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
                    onClick={() => setEdit((s) => ({ ...s, primary_color: t.primary_color, accent_color: t.accent_color, bg_color: t.bg_color }))}
                    title={t.name}
                    style={{
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                      background: t.primary_color,
                      color: isLight ? "#111" : "#fff",
                      border: 0,
                      borderRadius: 4,
                      cursor: "pointer",
                      boxShadow: edit.primary_color === t.primary_color ? "0 0 0 2px #333" : "none",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              Principal <input type="color" value={edit.primary_color ?? "#6366f1"} onChange={(e) => setEdit((s) => ({ ...s, primary_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
              Destaque <input type="color" value={edit.accent_color ?? "#ec4899"} onChange={(e) => setEdit((s) => ({ ...s, accent_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
              Fundo <input type="color" value={edit.bg_color ?? "#080810"} onChange={(e) => setEdit((s) => ({ ...s, bg_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
            </div>
          </div>
          <input
            placeholder="Cotação símbolo (BTC/ETH)"
            value={edit.cotacao_symbol ?? ""}
            onChange={(e) => setEdit((s) => ({ ...s, cotacao_symbol: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <input
            placeholder="Cotação texto livre"
            value={edit.cotacao_label ?? ""}
            onChange={(e) => setEdit((s) => ({ ...s, cotacao_label: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Mensalidade (USDC)</label>
            <input
              placeholder="Ex: 9.99 (deixe vazio = grátis)"
              value={edit.monthly_price_usdc ?? ""}
              onChange={(e) => setEdit((s) => ({ ...s, monthly_price_usdc: e.target.value || null, subscription_plan: e.target.value ? "monthly" : null }))}
              style={{ padding: "0.5rem", width: "12rem" }}
            />
            {edit.next_billing_at && (
              <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "0.25rem" }}>
                Próxima cobrança: {new Date(edit.next_billing_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => updateMutation.mutate(edit)}
            disabled={updateMutation.isPending}
            style={{ padding: "0.5rem 1rem", background: "#333", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" }}
          >
            {updateMutation.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Ideias</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ideaForm.title || ideaForm.content) addIdeaMutation.mutate(ideaForm);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}
        >
          <input
            placeholder="Título da ideia"
            value={ideaForm.title}
            onChange={(e) => setIdeaForm((f) => ({ ...f, title: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <textarea
            placeholder="Conteúdo"
            value={ideaForm.content}
            onChange={(e) => setIdeaForm((f) => ({ ...f, content: e.target.value }))}
            rows={2}
            style={{ padding: "0.5rem" }}
          />
          <button
            type="submit"
            disabled={addIdeaMutation.isPending}
            style={{ padding: "0.5rem 1rem", background: "#333", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" }}
          >
            Adicionar ideia
          </button>
        </form>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {site.ideas?.map((idea) => (
            <li
              key={idea.id}
              style={{
                padding: "0.75rem",
                marginBottom: "0.5rem",
                background: "#f0f0f0",
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                {idea.title && <strong style={{ display: "block" }}>{idea.title}</strong>}
                {idea.content && <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#444" }}>{idea.content}</p>}
              </div>
              <button
                type="button"
                onClick={() => deleteIdeaMutation.mutate(idea.id)}
                disabled={deleteIdeaMutation.isPending}
                style={{ padding: "0.25rem 0.5rem", background: "#c00", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </section>

      {site.slug && (
        <p>
          <Link href={`/s/${site.slug}`} style={{ color: "#0066cc" }}>Ver mini site público →</Link>
        </p>
      )}

      {edit.monthly_price_usdc && parseFloat(edit.monthly_price_usdc) > 0 && (
        <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pagar mensalidade</h2>
          <p style={{ fontSize: "0.9rem", color: "#166534", marginBottom: "0.5rem" }}>
            Valor: <strong>{edit.monthly_price_usdc} USDC</strong>/mês. Obtenha o destino e o valor em <strong>GET /api/payments/config?type=MINISITE_SUBSCRIPTION&amp;reference_id={site.id}</strong>, pague em USDC e depois use <strong>POST /api/payments/verify</strong> com type=MINISITE_SUBSCRIPTION, reference_id={site.id} e tx_hash.
          </p>
        </section>
      )}
    </main>
  );
}
