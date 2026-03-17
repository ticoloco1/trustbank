"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MINISITE_THEMES } from "@/lib/minisite-themes";
import { useCart } from "@/context/CartContext";
import { BACKGROUND_OPTIONS, articleBackgroundStyles, getArticleBackgroundClass } from "@/lib/article-page";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });
import ImageUpload from "@/components/ImageUpload";
import SectionOrderSortable from "@/components/SectionOrderSortable";

type Idea = { id: string; title: string | null; content: string | null; image_url: string | null };
type GalleryItem = { url: string; caption?: string };
type ListedDomain = { id: string; name: string; slug: string; price: string | null; description: string | null; link: string | null; status: string };
type MiniSite = {
  id: string;
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  layout_columns: number | null;
  template: string | null;
  theme: string | null;
  primary_color: string | null;
  accent_color: string | null;
  bg_color: string | null;
  cotacao_symbol: string | null;
  cotacao_label: string | null;
  ticker_bar_color?: string | null;
  content_order?: string | null;
  banner_url?: string | null;
  feed_image_1?: string | null;
  feed_image_2?: string | null;
  feed_image_3?: string | null;
  feed_image_4?: string | null;
  gallery_images?: GalleryItem[] | null;
  subscription_plan: string | null;
  monthly_price_usdc: string | null;
  next_billing_at: string | null;
  ideas: Idea[];
  mini_site_videos?: { video: { id: string; youtube_id: string; title: string | null; thumbnail_url: string | null; quotation?: { total_shares: number; valuation_usdc: string | null; ticker_symbol: string | null; revenue_usdc: string | null } | null } }[];
  cv_contact_email?: string | null;
  cv_contact_phone?: string | null;
  cv_contact_whatsapp?: string | null;
  presentation_youtube_id?: string | null;
  show_cv_expandable?: boolean | null;
  site_paywall_enabled?: boolean | null;
  donation_button_enabled?: boolean | null;
  module_order?: string[] | null;
  text_color?: string | null;
  heading_color?: string | null;
  font_size_base?: string | null;
  avatar_size?: string | null;
  badge_type?: string | null;
};

export default function EditMiniSitePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isAdmin, loading } = useAuth();
  const { address } = useAccount();
  const qc = useQueryClient();
  const [ideaForm, setIdeaForm] = useState({ title: "", content: "", image_url: "" });
  const [listingForm, setListingForm] = useState({
    price_usdc: "",
    listing_type: "sale" as "sale" | "auction",
    end_at: "",
    min_bid_usdc: "1",
  });
  const { addItem, hasItem } = useCart();

  const { data: site, isLoading } = useQuery({
    queryKey: ["mini-site", id],
    queryFn: async () => {
      const r = await fetch(`/api/mini-sites/${id}`);
      if (!r.ok) return null;
      return r.json() as Promise<MiniSite>;
    },
    enabled: !!id,
  });

  const { data: slugListings = [] } = useQuery({
    queryKey: ["slug-listings"],
    queryFn: async () => {
      const r = await fetch("/api/slugs");
      if (!r.ok) return [];
      return r.json() as Promise<{ id: string; mini_site_id?: string; mini_site?: { id: string }; status: string; listing_type: string; price_usdc: string }[]>;
    },
  });
  const myListing = slugListings.find((l: { mini_site?: { id: string } }) => l.mini_site?.id === id) ?? null;

  const { data: extraPages = [], refetch: refetchPages } = useQuery({
    queryKey: ["mini-site-pages", id],
    queryFn: async () => {
      const r = await fetch(`/api/mini-sites/${id}/pages`);
      if (!r.ok) return [];
      return r.json() as Promise<{ id: string; title: string; page_slug: string; content_html: string | null; background: string | null }[]>;
    },
    enabled: !!id,
  });

  const { data: listedDomains = [], refetch: refetchDomains } = useQuery({
    queryKey: ["mini-site-domains", id],
    queryFn: async () => {
      const r = await fetch(`/api/mini-sites/${id}/domains`);
      if (!r.ok) return [];
      return r.json() as Promise<ListedDomain[]>;
    },
    enabled: !!id,
  });

  const [pageForm, setPageForm] = useState({ title: "", page_slug: "", content_html: "", background: "white-lines" as string });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const createPageMutation = useMutation({
    mutationFn: async (payload: { title: string; page_slug: string; content_html: string; background: string }) => {
      const r = await fetch(`/api/mini-sites/${id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => {
      refetchPages();
      setPageForm({ title: "", page_slug: "", content_html: "", background: "white-lines" });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, payload }: { pageId: string; payload: { title?: string; page_slug?: string; content_html?: string; background?: string } }) => {
      const r = await fetch(`/api/mini-sites/${id}/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      refetchPages();
      setEditingPageId(null);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const r = await fetch(`/api/mini-sites/${id}/pages/${pageId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => refetchPages(),
  });

  const [domainForm, setDomainForm] = useState({ name: "", price: "", description: "", link: "" });
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);

  const createDomainMutation = useMutation({
    mutationFn: async (payload: { name: string; price?: string; description?: string; link?: string }) => {
      const r = await fetch(`/api/mini-sites/${id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => {
      refetchDomains();
      setDomainForm({ name: "", price: "", description: "", link: "" });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ domainId, payload }: { domainId: string; payload: Partial<{ name: string; price: string; description: string; link: string; status: string }> }) => {
      const r = await fetch(`/api/mini-sites/${id}/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      refetchDomains();
      setEditingDomainId(null);
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const r = await fetch(`/api/mini-sites/${id}/domains/${domainId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => refetchDomains(),
  });

  const [videoIdToAdd, setVideoIdToAdd] = useState("");
  const [editingQuotationVideoId, setEditingQuotationVideoId] = useState<string | null>(null);
  const [quotationForm, setQuotationForm] = useState({ total_shares: 1000000, system_percent: 20, sellable_percent: 70, valuation_usdc: "", ticker_symbol: "", revenue_usdc: "" });
  const addVideoMutation = useMutation({
    mutationFn: async (vid: string) => {
      const r = await fetch(`/api/mini-sites/${id}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: vid }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao adicionar");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mini-site", id] });
      setVideoIdToAdd("");
    },
  });
  const removeVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const r = await fetch(`/api/mini-sites/${id}/videos/${videoId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha ao remover");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mini-site", id] }),
  });
  const updateQuotationMutation = useMutation({
    mutationFn: async ({ videoId, payload }: { videoId: string; payload: { admin_wallet?: string; total_shares?: number; system_percent?: number; sellable_percent?: number; valuation_usdc?: string; ticker_symbol?: string; revenue_usdc?: string } }) => {
      const r = await fetch(`/api/videos/${videoId}/quotation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Falha ao salvar cotação");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mini-site", id] });
      setEditingQuotationVideoId(null);
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", id],
    queryFn: async () => {
      const r = await fetch(`/api/analytics?mini_site_id=${encodeURIComponent(id)}`);
      if (!r.ok) return null;
      return r.json() as Promise<{
        total_views: number;
        unique_visitors: number;
        by_path: { path: string; views: number; uniques: number }[];
        by_day: { date: string; views: number; uniques: number }[];
        by_referrer?: { source: string; views: number }[];
        recent_clicks?: { path: string; label: string | null; at: string }[];
      }>;
    },
    enabled: !!id,
  });

  const listSlugMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/slugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mini_site_id: id,
          seller_wallet: address?.toLowerCase(),
          price_usdc: listingForm.price_usdc,
          listing_type: listingForm.listing_type,
          end_at: listingForm.listing_type === "auction" && listingForm.end_at ? listingForm.end_at : undefined,
          min_bid_usdc: listingForm.listing_type === "auction" ? listingForm.min_bid_usdc : undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Failed to list");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-listings"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formPayload: Partial<MiniSite>) => {
      // Refetch deste mini site para nunca enviar dados de outro (evita foto de um site apagar no outro)
      const getRes = await fetch(`/api/mini-sites/${id}`);
      if (!getRes.ok) throw new Error("Falha ao carregar dados atuais");
      const latest = (await getRes.json()) as MiniSite;
      if (latest.id !== id) throw new Error("Mini site não corresponde");
      // Só usa formPayload se for do site atual; senão envia só o latest (seguro)
      const fromForm = formPayload.id === id ? formPayload : {};
      const payload: Record<string, unknown> = {
        ...latest,
        ...fromForm,
        id: latest.id,
      };
      delete payload.ideas;
      delete payload.slug_listings;
      delete payload.payments;
      delete payload.analytics_events;
      delete payload.extra_pages;
      delete payload.listed_domains;
      delete payload.mini_site_videos;
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
    mutationFn: async (payload: { title: string; content: string; image_url?: string }) => {
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
      setIdeaForm({ title: "", content: "", image_url: "" });
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
        <p>Loading — connect your admin wallet to continue.</p>
        <Link href="/">← Back</Link>
      </main>
    );
  }

  // Só mostra o form quando temos dados do mini site correto (evita usar dados de outro site)
  if (isLoading || !site || site.id !== id) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>{!site ? "Mini site not found or loading…" : "Loading this mini site…"}</p>
        <Link href="/dashboard">← Dashboard</Link>
      </main>
    );
  }

  const [edit, setEdit] = useState<MiniSite | null>(null);
  const prevIdRef = useRef<string | null>(null);

  // Ao trocar de mini site (id), limpa edit para nunca usar dados do site anterior
  useEffect(() => {
    prevIdRef.current = null;
    setEdit(null);
  }, [id]);

  // Sincroniza edit só quando o site carregado for realmente deste id
  useEffect(() => {
    if (!site || site.id !== id) return;
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      setEdit({ ...site });
    }
  }, [id, site]);

  // Só usar edit se for do site atual; senão usar site (evita mostrar/enviar dados de outro mini site)
  const formData = (edit && edit.id === id ? edit : site) as MiniSite;

  const mergeEdit = (prev: MiniSite | null, patch: Partial<MiniSite>): MiniSite => {
    const base = (prev && prev.id === id) ? prev : site;
    return { ...base, ...patch } as MiniSite;
  };

  const previewSlug = formData.slug ?? "";

  return (
    <main style={{ padding: "1rem 1.5rem", fontFamily: "system-ui", minHeight: "100vh", background: "#f1f5f9" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem" }}>← Mini sites</Link>
      </div>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.35rem", marginBottom: "1rem" }}>
        Edit: {formData.site_name || formData.slug || id.slice(0, 8)}
        {isAdmin && <span style={{ fontSize: "0.65rem", fontWeight: 600, background: "#fef08a", color: "#854d0e", padding: "0.2rem 0.5rem", borderRadius: 4 }}>ADMIN</span>}
      </h1>

      {/* Layout 2 colunas: esquerda = config (scroll), direita = preview fixo */}
      <div className="dashboard-minisite-grid">
        <div key={id} style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
      <section style={{ padding: "1.25rem", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem", color: "#1e293b" }}>PERFIL</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
            placeholder="Nome / Display name"
            value={formData.site_name ?? ""}
            onChange={(e) => setEdit((prev) => mergeEdit(prev, { site_name: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 8 }}
          />
          <input
            placeholder="Slug (URL: /s/[slug])"
            value={formData.slug ?? ""}
            onChange={(e) => setEdit((prev) => mergeEdit(prev, { slug: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 8 }}
          />
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem", color: "#64748b" }}>Bio — editor completo</label>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", minHeight: 120 }}>
              <RichTextEditor value={formData.bio ?? ""} onChange={(html) => setEdit((prev) => mergeEdit(prev, { bio: html }))} placeholder="Conte sobre você..." minHeight={100} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Template</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "default" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "default" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "default" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Default layout
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "investor" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "investor" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "investor" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Investor feed (crypto, NFTs, feed)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "domains" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "domains" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "domains" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Domain investor (cotação, gráficos, catálogo domínios)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "premium" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "premium" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "premium" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Premium (estilo banco)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "premium_dark" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "premium_dark" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "premium_dark" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Premium Dark (luxo)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "premium_fintech" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "premium_fintech" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "premium_fintech" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Premium Fintech (moderno)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "profile" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "profile" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "profile" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Profile (Linktree)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "netflix" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "netflix" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "netflix" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Netflix (grid vídeos)
              </button>
              <button
                type="button"
                onClick={() => setEdit((prev) => mergeEdit(prev, { template: "cv_pro" }))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 6,
                  border: (formData.template ?? "default") === "cv_pro" ? "2px solid #6366f1" : "1px solid #ccc",
                  background: (formData.template ?? "default") === "cv_pro" ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                CV Pro (LinkedIn + cadeado)
              </button>
            </div>
          </div>
          {(formData.template ?? "") === "cv_pro" && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(10,102,194,0.06)", borderRadius: 8, border: "1px solid rgba(10,102,194,0.2)" }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Contato protegido (CV Pro)</h3>
              <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.75rem" }}>E-mail, telefone e WhatsApp ficam ocultos até uma empresa desbloquear (pago). Só aparecem aqui para você editar.</p>
              <input
                type="email"
                placeholder="E-mail profissional"
                value={formData.cv_contact_email ?? ""}
                onChange={(e) => setEdit((prev) => mergeEdit(prev, { cv_contact_email: e.target.value || null }))}
                style={{ padding: "0.5rem", marginBottom: "0.5rem", width: "100%", maxWidth: 320 }}
              />
              <input
                type="tel"
                placeholder="Telefone (ex: +5511999998888)"
                value={formData.cv_contact_phone ?? ""}
                onChange={(e) => setEdit((prev) => mergeEdit(prev, { cv_contact_phone: e.target.value || null }))}
                style={{ padding: "0.5rem", marginBottom: "0.5rem", width: "100%", maxWidth: 320 }}
              />
              <input
                type="text"
                placeholder="WhatsApp (número com DDI)"
                value={formData.cv_contact_whatsapp ?? ""}
                onChange={(e) => setEdit((prev) => mergeEdit(prev, { cv_contact_whatsapp: e.target.value || null }))}
                style={{ padding: "0.5rem", width: "100%", maxWidth: 320 }}
              />
            </div>
          )}
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Layout (columns)</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {([1, 2, 3] as const).map((cols) => (
                <button key={cols} type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { layout_columns: cols }))}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: (formData.layout_columns ?? 1) === cols ? "2px solid #6366f1" : "1px solid #ccc", background: (formData.layout_columns ?? 1) === cols ? "#eef2ff" : "#fff", cursor: "pointer" }}>
                  {cols} column{cols > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
          <section style={{ padding: "1rem", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>VÍDEO DE APRESENTAÇÃO</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Cole um link do YouTube para exibir no seu site. Só embed de YouTube.</p>
            <input
              placeholder="https://youtube.com/watch?v=..."
              value={formData.presentation_youtube_id ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const id = v.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || v;
                setEdit((prev) => mergeEdit(prev, { presentation_youtube_id: id || null }));
              }}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 8, width: "100%", maxWidth: 400 }}
            />
          </section>
          <section style={{ padding: "1rem", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>VIDEO LAYOUT</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {([1, 2, 3] as const).map((cols) => (
                <button key={cols} type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { layout_columns: cols }))}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: (formData.layout_columns ?? 1) === cols ? "2px solid #0d9488" : "1px solid #e2e8f0", background: (formData.layout_columns ?? 1) === cols ? "#ccfbf1" : "#f8fafc", cursor: "pointer" }}>
                  {cols} coluna{cols > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </section>
          <section style={{ padding: "1rem", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>CV / RESUME & CONTACT</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.9rem" }}>Mostrar CV expansível</span>
              <button type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { show_cv_expandable: !(formData.show_cv_expandable ?? false) }))} style={{ width: 44, height: 24, borderRadius: 12, background: formData.show_cv_expandable ? "#0d9488" : "#cbd5e1", border: 0, cursor: "pointer", position: "relative" }} aria-label="Toggle"><span style={{ position: "absolute", left: formData.show_cv_expandable ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></button>
            </div>
          </section>
          <section style={{ padding: "1rem", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>PAYWALL DO SITE (ONLYFANS-STYLE)</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Ative para cobrar acesso. Visitantes verão apenas o banner até pagar.</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem" }}>Ativar paywall do site</span>
              <button type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { site_paywall_enabled: !(formData.site_paywall_enabled ?? false) }))} style={{ width: 44, height: 24, borderRadius: 12, background: formData.site_paywall_enabled ? "#6366f1" : "#cbd5e1", border: 0, cursor: "pointer", position: "relative" }} aria-label="Toggle"><span style={{ position: "absolute", left: formData.site_paywall_enabled ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.9rem" }}>Botão de doação</span>
              <button type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { donation_button_enabled: !(formData.donation_button_enabled ?? false) }))} style={{ width: 44, height: 24, borderRadius: 12, background: formData.donation_button_enabled ? "#6366f1" : "#cbd5e1", border: 0, cursor: "pointer", position: "relative" }} aria-label="Toggle"><span style={{ position: "absolute", left: formData.donation_button_enabled ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></button>
            </div>
          </section>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Theme & colors</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {MINISITE_THEMES.map((t) => {
                const isLight = ["#f9fafb", "#eff6ff", "#fef2f2", "#fefce8", "#f5f3ff", "#faf5ff", "#f0fdf4", "#ecfdf5", "#eef2ff", "#fff7ed", "#e5e7eb"].includes(t.primary_color.toLowerCase());
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEdit((prev) => mergeEdit(prev, { theme: t.id, primary_color: t.primary_color, accent_color: t.accent_color, bg_color: t.bg_color }))}
                    title={t.name}
                    style={{
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.75rem",
                      background: t.primary_color,
                      color: isLight ? "#111" : "#fff",
                      border: 0,
                      borderRadius: 4,
                      cursor: "pointer",
                      boxShadow: formData.primary_color === t.primary_color ? "0 0 0 2px #333" : "none",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              Primary <input type="color" value={formData.primary_color ?? "#6366f1"} onChange={(e) => setEdit((prev) => mergeEdit(prev, { primary_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
              Accent <input type="color" value={formData.accent_color ?? "#ec4899"} onChange={(e) => setEdit((prev) => mergeEdit(prev, { accent_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
              Background <input type="color" value={formData.bg_color ?? "#080810"} onChange={(e) => setEdit((prev) => mergeEdit(prev, { bg_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem" }}>Texto</span>
              <input type="color" value={formData.text_color ?? "#1e293b"} onChange={(e) => setEdit((prev) => mergeEdit(prev, { text_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} title="Cor das letras" />
              <span style={{ fontSize: "0.9rem" }}>Títulos</span>
              <input type="color" value={formData.heading_color ?? "#0f172a"} onChange={(e) => setEdit((prev) => mergeEdit(prev, { heading_color: e.target.value }))} style={{ width: 36, height: 28, padding: 0, border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }} title="Cor dos títulos" />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.35rem" }}>Tamanho da fonte</span>
              {(["small", "medium", "large"] as const).map((size) => (
                <button key={size} type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { font_size_base: size }))} style={{ marginRight: "0.35rem", padding: "0.35rem 0.6rem", fontSize: "0.85rem", borderRadius: 6, border: (formData.font_size_base ?? "medium") === size ? "2px solid #6366f1" : "1px solid #ccc", background: (formData.font_size_base ?? "medium") === size ? "#eef2ff" : "#fff", cursor: "pointer" }}>
                  {size === "small" ? "Pequeno" : size === "medium" ? "Médio" : "Grande"}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.35rem" }}>Tamanho da foto de perfil</span>
              {(["P", "M", "G", "GG"] as const).map((av) => (
                <button key={av} type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { avatar_size: av }))} style={{ marginRight: "0.35rem", padding: "0.35rem 0.6rem", fontSize: "0.85rem", borderRadius: 6, border: (formData.avatar_size ?? "M") === av ? "2px solid #6366f1" : "1px solid #ccc", background: (formData.avatar_size ?? "M") === av ? "#eef2ff" : "#fff", cursor: "pointer" }}>
                  {av}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.35rem" }}>Selo</span>
              {([null, "blue", "gold"] as const).map((badge) => (
                <button key={badge ?? "none"} type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { badge_type: badge }))} style={{ marginRight: "0.35rem", padding: "0.35rem 0.6rem", fontSize: "0.85rem", borderRadius: 6, border: (formData.badge_type ?? null) === badge ? "2px solid #6366f1" : "1px solid #ccc", background: (formData.badge_type ?? null) === badge ? "#eef2ff" : "#fff", cursor: "pointer" }}>
                  {badge === null ? "Nenhum" : badge === "blue" ? "Azul (mini site)" : "Dourado (empresa)"}
                </button>
              ))}
            </div>
          </div>
          <input
            placeholder="Quote symbol (BTC/ETH)"
            value={formData.cotacao_symbol ?? ""}
            onChange={(e) => setEdit((prev) => mergeEdit(prev, { cotacao_symbol: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          <input
            placeholder="Quote label (optional)"
            value={formData.cotacao_label ?? ""}
            onChange={(e) => setEdit((prev) => mergeEdit(prev, { cotacao_label: e.target.value }))}
            style={{ padding: "0.5rem" }}
          />
          {(formData.template === "investor" || formData.template === "domains") && (
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Cor da barra do ticker</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <input type="color" value={formData.ticker_bar_color ?? "#e5e7eb"} onChange={(e) => setEdit((prev) => mergeEdit(prev, { ticker_bar_color: e.target.value }))} style={{ width: 40, height: 32, padding: 0, border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }} />
                <input type="text" placeholder="ex: #1e293b ou #0d9488" value={formData.ticker_bar_color ?? ""} onChange={(e) => setEdit((prev) => mergeEdit(prev, { ticker_bar_color: e.target.value || null }))} style={{ padding: "0.5rem", width: 180 }} />
              </div>
            </div>
          )}
          {(formData.template === "default" && (formData.layout_columns === 2 || formData.layout_columns === 3)) && (
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Ordem dos blocos (arraste para reordenar)</label>
              <SectionOrderSortable
                value={(formData.content_order as "cotacao_first" | "posts_first") ?? "cotacao_first"}
                onChange={(v) => setEdit((prev) => mergeEdit(prev, { content_order: v }))}
              />
            </div>
          )}
          <section style={{ marginTop: "1rem", padding: "1.25rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12 }}>
            <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem", color: "#166534" }}>📷 Imagens — só upload (sem links)</h3>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Banner / capa</label>
            <ImageUpload prefix={`${id}-banner`} label="Enviar banner" onUpload={(url) => setEdit((prev) => mergeEdit(prev, { banner_url: url }))} />
            {formData.banner_url && <img src={formData.banner_url} alt="" style={{ marginTop: "0.5rem", maxWidth: "100%", height: 80, objectFit: "cover", borderRadius: 8 }} />}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Foto de perfil (e feed 1–4)</label>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Foto 1 = avatar no preview.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <ImageUpload prefix={`${id}-feed`} label="Foto 1" onUpload={(url) => setEdit((prev) => mergeEdit(prev, { feed_image_1: url }))} />
              <ImageUpload prefix={`${id}-feed`} label="Foto 2" onUpload={(url) => setEdit((prev) => mergeEdit(prev, { feed_image_2: url }))} />
              <ImageUpload prefix={`${id}-feed`} label="Foto 3" onUpload={(url) => setEdit((prev) => mergeEdit(prev, { feed_image_3: url }))} />
              <ImageUpload prefix={`${id}-feed`} label="Foto 4" onUpload={(url) => setEdit((prev) => mergeEdit(prev, { feed_image_4: url }))} />
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Galeria</label>
            <ImageUpload prefix={`${id}-gallery`} label="+ Enviar e adicionar à galeria" onUpload={(url) => setEdit((prev) => { const base = prev && prev.id === id ? prev : site; const list = Array.isArray(base.gallery_images) ? base.gallery_images : []; return mergeEdit(prev, { gallery_images: [...list, { url, caption: "" }] }); })} />
            {(Array.isArray(formData.gallery_images) ? formData.gallery_images : []).map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {item.url && <img src={item.url} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />}
                <input placeholder="Legenda" value={item.caption ?? ""} onChange={(e) => { const base = formData.id === id ? formData : site; const next = [...(base.gallery_images || [])]; next[idx] = { ...next[idx], caption: e.target.value || undefined }; setEdit((prev) => mergeEdit(prev, { gallery_images: next })); }} style={{ padding: "0.35rem 0.5rem", flex: 1, minWidth: 120, border: "1px solid #e2e8f0", borderRadius: 6 }} />
                <button type="button" onClick={() => setEdit((prev) => mergeEdit(prev, { gallery_images: (formData.gallery_images || []).filter((_, i) => i !== idx) }))} style={{ padding: "0.35rem 0.6rem", background: "#dc2626", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" }}>Remover</button>
              </div>
            ))}
          </div>
          </section>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Monthly (USDC)</label>
            <input
              placeholder="29.90 (default, empty = free)"
              value={formData.monthly_price_usdc ?? ""}
              onChange={(e) => setEdit((prev) => mergeEdit(prev, { monthly_price_usdc: e.target.value || null, subscription_plan: e.target.value ? "monthly" : null }))}
              style={{ padding: "0.5rem", width: "12rem" }}
            />
            {formData.next_billing_at && (
              <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "0.25rem" }}>
                Next billing: {new Date(formData.next_billing_at).toLocaleDateString()}
              </p>
            )}
            {(formData.monthly_price_usdc ?? site?.monthly_price_usdc) && parseFloat(formData.monthly_price_usdc ?? site?.monthly_price_usdc ?? "0") > 0 && (
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {!hasItem("MINISITE_SUBSCRIPTION", id) && (
                  <button
                    type="button"
                    onClick={() => addItem({
                      type: "MINISITE_SUBSCRIPTION",
                      reference_id: id,
                      label: `Subscription: ${site?.site_name || site?.slug || id}`,
                      amount_usdc: (formData.monthly_price_usdc ?? site?.monthly_price_usdc) ?? "29.90",
                    })}
                    style={{ padding: "0.4rem 0.75rem", background: "#334155", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    Add subscription to cart
                  </button>
                )}
                <Link href="/cart" style={{ fontSize: "0.9rem", color: "#0066cc" }}>View cart</Link>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending || formData.id !== id}
            style={{ padding: "0.5rem 1rem", background: formData.id !== id ? "#999" : "#333", color: "#fff", border: 0, borderRadius: 6, cursor: formData.id !== id ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
          >
            {updateMutation.isPending ? "Saving…" : formData.id !== id ? "Carregando este site…" : "Save"}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: "2rem", padding: "1rem", background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Analytics</h2>
        <p style={{ fontSize: "0.85rem", color: "#166534", marginBottom: "0.75rem" }}>Page views and visitors for this mini site.</p>
        {analytics ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#666" }}>Total views</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#15803d" }}>{analytics.total_views}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#666" }}>Unique visitors</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#15803d" }}>{analytics.unique_visitors}</div>
              </div>
            </div>
            {analytics.by_path && analytics.by_path.length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>By page</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ccc" }}>
                      <th style={{ textAlign: "left", padding: "0.35rem 0" }}>Path</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0" }}>Views</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0" }}>Uniques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.by_path.map((row) => (
                      <tr key={row.path} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.35rem 0" }}>{row.path || "/"}</td>
                        <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{row.views}</td>
                        <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{row.uniques}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {analytics.by_day && analytics.by_day.length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>By day (last 14)</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ccc" }}>
                      <th style={{ textAlign: "left", padding: "0.35rem 0" }}>Date</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0" }}>Views</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0" }}>Uniques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.by_day.slice(-14).map((row) => (
                      <tr key={row.date} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.35rem 0" }}>{row.date}</td>
                        <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{row.views}</td>
                        <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{row.uniques}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {analytics.by_referrer && analytics.by_referrer.length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Where visitors come from (source)</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ccc" }}>
                      <th style={{ textAlign: "left", padding: "0.35rem 0" }}>Source / referrer</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0" }}>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.by_referrer.map((row) => (
                      <tr key={row.source} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.35rem 0", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }} title={row.source}>{row.source === "direct" ? "Direct / typed URL" : row.source}</td>
                        <td style={{ textAlign: "right", padding: "0.35rem 0" }}>{row.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {analytics.recent_clicks && analytics.recent_clicks.length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Recent clicks</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ccc" }}>
                      <th style={{ textAlign: "left", padding: "0.35rem 0" }}>Label / target</th>
                      <th style={{ textAlign: "left", padding: "0.35rem 0" }}>Path</th>
                      <th style={{ textAlign: "left", padding: "0.35rem 0" }}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recent_clicks.slice(0, 20).map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.35rem 0" }}>{c.label || "—"}</td>
                        <td style={{ padding: "0.35rem 0" }}>{c.path || "/"}</td>
                        <td style={{ padding: "0.35rem 0", fontSize: "0.8rem", color: "#666" }}>{new Date(c.at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: "0.9rem", color: "#666" }}>No data yet. Views are recorded when someone opens your mini site.</p>
        )}
      </section>

      <section style={{ marginBottom: "2rem", padding: "1rem", background: "#eff6ff", borderRadius: 8, border: "1px solid #93c5fd" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Premium Domains (domain investor)</h2>
        <p style={{ fontSize: "0.85rem", color: "#1e40af", marginBottom: "0.75rem" }}>
          Catálogo de domínios para venda. Cada domínio ganha uma página indexável em trustbank.xyz/d/[slug]. Use o template &quot;Investor feed&quot; para exibir a lista no mini site.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "1rem" }}>
          {listedDomains.map((d) => (
            <li key={d.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #bfdbfe", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span>
                <strong>{d.name}</strong>
                {d.price && ` — $${d.price}`}
                {d.status !== "available" && <span style={{ marginLeft: 6, fontSize: "0.8rem", color: "#64748b" }}>({d.status})</span>}
              </span>
              <span style={{ display: "flex", gap: "0.5rem" }}>
                <Link href={`/d/${d.slug}`} target="_blank" style={{ fontSize: "0.85rem", color: "#2563eb" }}>Ver página</Link>
                <button type="button" onClick={() => { setEditingDomainId(d.id); setDomainForm({ name: d.name, price: d.price ?? "", description: d.description ?? "", link: d.link ?? "" }); }} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#e0e7ff", border: 0, borderRadius: 4, cursor: "pointer" }}>Editar</button>
                <button type="button" onClick={() => deleteDomainMutation.mutate(d.id)} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#fecaca", border: 0, borderRadius: 4, cursor: "pointer" }}>Remover</button>
              </span>
            </li>
          ))}
        </ul>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>{editingDomainId ? "Editar domínio" : "Novo domínio"}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!domainForm.name.trim()) return;
            if (editingDomainId) {
              updateDomainMutation.mutate({ domainId: editingDomainId, payload: { name: domainForm.name.trim(), price: domainForm.price || undefined, description: domainForm.description || undefined, link: domainForm.link || undefined } });
            } else {
              createDomainMutation.mutate({ name: domainForm.name.trim(), price: domainForm.price || undefined, description: domainForm.description || undefined, link: domainForm.link || undefined });
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <input placeholder="Nome do domínio (ex: carinsurance.ai)" value={domainForm.name} onChange={(e) => setDomainForm((f) => ({ ...f, name: e.target.value }))} style={{ padding: "0.5rem" }} required />
          <input placeholder="Preço (ex: 8000 ou 12.000)" value={domainForm.price} onChange={(e) => setDomainForm((f) => ({ ...f, price: e.target.value }))} style={{ padding: "0.5rem" }} />
          <textarea placeholder="Descrição (SEO)" value={domainForm.description} onChange={(e) => setDomainForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ padding: "0.5rem" }} />
          <input placeholder="Link (Make offer / Buy now URL)" value={domainForm.link} onChange={(e) => setDomainForm((f) => ({ ...f, link: e.target.value }))} style={{ padding: "0.5rem" }} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={createDomainMutation.isPending || updateDomainMutation.isPending} style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>
              {editingDomainId ? "Salvar" : "Adicionar domínio"}
            </button>
            {editingDomainId && (
              <button type="button" onClick={() => { setEditingDomainId(null); setDomainForm({ name: "", price: "", description: "", link: "" }); }} style={{ padding: "0.5rem 1rem", background: "#94a3b8", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>LINKS &amp; POSTS (Feed)</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ideaForm.title || ideaForm.content || ideaForm.image_url) addIdeaMutation.mutate(ideaForm);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}
        >
          <input
            placeholder="Título do link ou post"
            value={ideaForm.title}
            onChange={(e) => setIdeaForm((f) => ({ ...f, title: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 8 }}
          />
          <div>
            <label style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.25rem", display: "block" }}>Conteúdo — editor completo</label>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, minHeight: 100 }}>
              <RichTextEditor value={ideaForm.content} onChange={(html) => setIdeaForm((f) => ({ ...f, content: html }))} placeholder="Texto ou URL do link..." minHeight={80} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.25rem", display: "block" }}>Imagem — só upload (sem link)</label>
            <ImageUpload prefix={`${id}-idea`} label="Enviar imagem" onUpload={(url) => setIdeaForm((f) => ({ ...f, image_url: url }))} />
          </div>
          <button
            type="submit"
            disabled={addIdeaMutation.isPending}
            style={{ padding: "0.5rem 1rem", background: "#333", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", alignSelf: "flex-start" }}
          >
            Adicionar link / post
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
              <div style={{ flex: 1 }}>
                {idea.title && <strong style={{ display: "block" }}>{idea.title}</strong>}
                {idea.image_url && <img src={idea.image_url} alt="" style={{ maxWidth: "100%", height: "auto", borderRadius: 6, marginTop: "0.25rem", maxHeight: 200, objectFit: "cover" }} />}
                {idea.content && <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#444" }}>{idea.content}</p>}
              </div>
              <button
                type="button"
                onClick={() => deleteIdeaMutation.mutate(idea.id)}
                disabled={deleteIdeaMutation.isPending}
                style={{ padding: "0.25rem 0.5rem", background: "#c00", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: "2rem", padding: "1.25rem", background: "#faf5ff", borderRadius: 12, border: "2px solid #7c3aed" }}>
        <style dangerouslySetInnerHTML={{ __html: articleBackgroundStyles }} />
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#5b21b6" }}>📄 Páginas extras / Artigos</h2>
        <p style={{ fontSize: "0.9rem", color: "#6b21a8", marginBottom: "0.5rem" }}>
          Até 5 páginas. Escolha o fundo: branco, amarelo notepad, cinza, claro, escuro, mapa pirata e mais.
        </p>
        <p style={{ fontSize: "0.95rem", color: "#4c1d95", marginBottom: "1rem", fontWeight: 600 }}>
          Editor rico: página branca com linhas, negrito, itálico, fontes, tamanhos, cores, imagens e links. Escolha o fundo abaixo.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: "1rem" }}>
          {extraPages.map((p) => (
            <li key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #e9d5ff" }}>
              <span>
                <strong>{p.title}</strong> — /{p.page_slug}
                {site.slug && (
                  <Link href={`/s/${site.slug}/p/${p.page_slug}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#7c3aed" }}>Ver</Link>
                )}
              </span>
              <span style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => { setEditingPageId(p.id); setPageForm({ title: p.title, page_slug: p.page_slug, content_html: p.content_html || "", background: p.background || "default" }); }} style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#7c3aed", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer" }}>Editar</button>
                <button type="button" onClick={() => deletePageMutation.mutate(p.id)} disabled={deletePageMutation.isPending} style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#dc2626", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer" }}>Excluir</button>
              </span>
            </li>
          ))}
        </ul>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>{editingPageId ? "Editar página" : "Nova página"} {extraPages.length >= 5 && !editingPageId && "(máx. 5)"}</h3>
        {extraPages.length >= 5 && !editingPageId ? (
          <p style={{ fontSize: "0.9rem", color: "#6b21a8" }}>Você já tem 5 páginas extras. Exclua uma para adicionar outra.</p>
        ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingPageId) {
              updatePageMutation.mutate({ pageId: editingPageId, payload: { title: pageForm.title, page_slug: pageForm.page_slug, content_html: pageForm.content_html, background: pageForm.background } });
            } else {
              createPageMutation.mutate(pageForm);
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 640 }}
        >
          <input placeholder="Título da página" value={pageForm.title} onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))} style={{ padding: "0.5rem" }} />
          <input placeholder="Slug da página (ex: sobre-nos)" value={pageForm.page_slug} onChange={(e) => setPageForm((f) => ({ ...f, page_slug: e.target.value }))} style={{ padding: "0.5rem" }} />
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.35rem" }}>Fundo da página</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {BACKGROUND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPageForm((f) => ({ ...f, background: opt.value }))}
                  style={{
                    padding: "0.35rem 0.6rem",
                    fontSize: "0.8rem",
                    background: pageForm.background === opt.value ? "#7c3aed" : "#e9d5ff",
                    color: pageForm.background === opt.value ? "#fff" : "#5b21b6",
                    border: 0,
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "1rem", marginBottom: "0.5rem", fontWeight: 600 }}>Conteúdo do artigo — escreva aqui (página com linhas)</label>
            <div className={getArticleBackgroundClass(pageForm.background)} style={{ border: "1px solid #c4b5fd", borderRadius: 8, padding: "1rem", minHeight: 360, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <RichTextEditor value={pageForm.content_html} onChange={(html) => setPageForm((f) => ({ ...f, content_html: html }))} placeholder="Use a barra de ferramentas: títulos, negrito, itálico, fontes, tamanhos, cores, listas, links, imagens..." minHeight={320} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={createPageMutation.isPending || updatePageMutation.isPending} style={{ padding: "0.5rem 1rem", background: "#7c3aed", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>
              {editingPageId ? "Salvar página" : "Salvar página"}
            </button>
            {editingPageId && <button type="button" onClick={() => { setEditingPageId(null); setPageForm({ title: "", page_slug: "", content_html: "", background: "white-lines" }); }} style={{ padding: "0.5rem 1rem", background: "#64748b", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>Cancelar</button>}
          </div>
        </form>
        )}
      </section>

      <section style={{ marginBottom: "2rem", padding: "1.25rem", background: "#ecfdf5", borderRadius: 12, border: "1px solid #a7f3d0" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#065f46" }}>Vídeos do negócio (flip card + corretora)</h2>
        <p style={{ fontSize: "0.85rem", color: "#047857", marginBottom: "1rem" }}>
          Vincule vídeos ao mini site para exibir o card com frente (embed) e verso (cotação/shares). A corretora fica embaçada até o usuário ter NFT do clube.
        </p>
        <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          <Link href="/site/edit" target="_blank" rel="noopener noreferrer" style={{ color: "#059669", fontWeight: 600 }}>Videos &amp; paywall</Link> — pegue o ID do vídeo na lista (ex: ao lado do título).
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
          <input placeholder="ID do vídeo (uuid)" value={videoIdToAdd} onChange={(e) => setVideoIdToAdd(e.target.value)} style={{ padding: "0.5rem", width: 280, maxWidth: "100%" }} />
          <button type="button" onClick={() => videoIdToAdd && addVideoMutation.mutate(videoIdToAdd)} disabled={!videoIdToAdd || addVideoMutation.isPending} style={{ padding: "0.5rem 1rem", background: "#059669", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>
            {addVideoMutation.isPending ? "Adicionando…" : "Adicionar vídeo"}
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {(site.mini_site_videos ?? []).map((msv) => (
            <li key={msv.video.id} style={{ padding: "0.75rem", marginBottom: "0.5rem", background: "#fff", borderRadius: 8, border: "1px solid #a7f3d0", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <span style={{ fontWeight: 500 }}>{msv.video.title || msv.video.youtube_id}</span>
              <span style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => { setEditingQuotationVideoId(msv.video.id); setQuotationForm({ total_shares: msv.video.quotation?.total_shares ?? 1000000, system_percent: (msv.video.quotation as { system_percent?: number })?.system_percent ?? 20, sellable_percent: (msv.video.quotation as { sellable_percent?: number })?.sellable_percent ?? 70, valuation_usdc: msv.video.quotation?.valuation_usdc ?? "", ticker_symbol: msv.video.quotation?.ticker_symbol ?? "", revenue_usdc: msv.video.quotation?.revenue_usdc ?? "" }); }} style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#0d9488", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer" }}>Cotação</button>
                <button type="button" onClick={() => removeVideoMutation.mutate(msv.video.id)} disabled={removeVideoMutation.isPending} style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#dc2626", color: "#fff", border: 0, borderRadius: 4, cursor: "pointer" }}>Remover</button>
              </span>
            </li>
          ))}
        </ul>
        {editingQuotationVideoId && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "#fff", borderRadius: 8, border: "1px solid #a7f3d0" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Editar cotação (verso do flip card)</h3>
            <p style={{ fontSize: "0.8rem", color: "#047857", marginBottom: "0.5rem" }}>20% sistema; 50–80% vendidos a investidores. Receita dividida entre cotas.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 400 }}>
              <label>Total de shares <input type="number" value={quotationForm.total_shares} onChange={(e) => setQuotationForm((f) => ({ ...f, total_shares: parseInt(e.target.value, 10) || 0 }))} style={{ marginLeft: 8, padding: "0.25rem" }} /></label>
              <label>Sistema % (fixo) <input type="number" min={0} max={100} value={quotationForm.system_percent} onChange={(e) => setQuotationForm((f) => ({ ...f, system_percent: parseInt(e.target.value, 10) || 0 }))} style={{ marginLeft: 8, padding: "0.25rem", width: 60 }} /></label>
              <label>Vendível % (50–80) <input type="number" min={50} max={80} value={quotationForm.sellable_percent} onChange={(e) => setQuotationForm((f) => ({ ...f, sellable_percent: parseInt(e.target.value, 10) || 70 }))} style={{ marginLeft: 8, padding: "0.25rem", width: 60 }} /></label>
              <label>Valor est. USDC <input value={quotationForm.valuation_usdc} onChange={(e) => setQuotationForm((f) => ({ ...f, valuation_usdc: e.target.value }))} placeholder="ex: 150000" style={{ marginLeft: 8, padding: "0.25rem" }} /></label>
              <label>Ticker (ex: $QLL40) <input value={quotationForm.ticker_symbol} onChange={(e) => setQuotationForm((f) => ({ ...f, ticker_symbol: e.target.value }))} style={{ marginLeft: 8, padding: "0.25rem" }} /></label>
              <label>Receita USDC <input value={quotationForm.revenue_usdc} onChange={(e) => setQuotationForm((f) => ({ ...f, revenue_usdc: e.target.value }))} placeholder="acumulada" style={{ marginLeft: 8, padding: "0.25rem" }} /></label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => updateQuotationMutation.mutate({ videoId: editingQuotationVideoId, payload: { ...quotationForm, admin_wallet: address } })} disabled={updateQuotationMutation.isPending || !address} style={{ padding: "0.5rem 1rem", background: "#059669", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>Salvar (só admin)</button>
                <button type="button" onClick={() => setEditingQuotationVideoId(null)} style={{ padding: "0.5rem 1rem", background: "#64748b", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {site.slug && (
        <p style={{ marginBottom: "1rem" }}>
          <Link href={`/s/${site.slug}`} style={{ color: "#0066cc" }}>Ver mini site →</Link>
          {site.slug.startsWith("@") && (
            <span style={{ marginLeft: "0.5rem", color: "#1e3a8a", fontWeight: 600 }}>trustbank.xyz/{site.slug}</span>
          )}
          {" · "}
          <Link href="/market" style={{ color: "#0066cc" }}>Marketplace</Link>
        </p>
      )}

      <section id="marketplace" style={{ marginBottom: "2rem", padding: "1rem", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Vender, leilão ou transferir</h2>
        {!address ? (
          <p style={{ fontSize: "0.9rem", color: "#555" }}>Connect your wallet to list this mini-site for sale or auction. Seller receives 90% (10% platform fee).</p>
        ) : myListing && myListing.status === "active" ? (
          <p style={{ fontSize: "0.9rem", color: "#166534" }}>
            Listed as <strong>{myListing.listing_type}</strong> at {myListing.price_usdc} USDC.{" "}
            <Link href={`/market/${myListing.id}`} style={{ color: "#0066cc" }}>View on market →</Link>
          </p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (listingForm.price_usdc) listSlugMutation.mutate(); }}
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 360 }}
          >
            <input
              placeholder="Price (USDC)"
              value={listingForm.price_usdc}
              onChange={(e) => setListingForm((f) => ({ ...f, price_usdc: e.target.value }))}
              style={{ padding: "0.5rem" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ fontSize: "0.9rem" }}>
                <input type="radio" checked={listingForm.listing_type === "sale"} onChange={() => setListingForm((f) => ({ ...f, listing_type: "sale" }))} /> Sale
              </label>
              <label style={{ fontSize: "0.9rem" }}>
                <input type="radio" checked={listingForm.listing_type === "auction"} onChange={() => setListingForm((f) => ({ ...f, listing_type: "auction" }))} /> Auction
              </label>
            </div>
            {listingForm.listing_type === "auction" && (
              <>
                <input
                  type="datetime-local"
                  placeholder="End date/time"
                  value={listingForm.end_at}
                  onChange={(e) => setListingForm((f) => ({ ...f, end_at: e.target.value }))}
                  style={{ padding: "0.5rem" }}
                />
                <input
                  placeholder="Min bid increment (USDC)"
                  value={listingForm.min_bid_usdc}
                  onChange={(e) => setListingForm((f) => ({ ...f, min_bid_usdc: e.target.value }))}
                  style={{ padding: "0.5rem" }}
                />
              </>
            )}
            <button
              type="submit"
              disabled={listSlugMutation.isPending || !listingForm.price_usdc}
              style={{ padding: "0.5rem 1rem", background: "#0284c7", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" }}
            >
              {listSlugMutation.isPending ? "Listing…" : "List for sale / auction"}
            </button>
          </form>
        )}
      </section>

      {formData.monthly_price_usdc && parseFloat(formData.monthly_price_usdc) > 0 && (
        <section style={{ marginTop: "1rem", padding: "1rem", background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Pay subscription</h2>
          <p style={{ fontSize: "0.9rem", color: "#166534", marginBottom: "0.5rem" }}>
            Amount: <strong>{formData.monthly_price_usdc} USDC</strong>/month. Get destination and amount from <strong>GET /api/payments/config?type=MINISITE_SUBSCRIPTION&amp;reference_id={site.id}</strong>, pay in USDC, then call <strong>POST /api/payments/verify</strong> with type=MINISITE_SUBSCRIPTION, reference_id={site.id} and tx_hash.
          </p>
        </section>
      )}
        </div>

        {/* Coluna direita: preview fixo */}
        <aside className="dashboard-preview-col" style={{ position: "sticky", top: "1rem", background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", minHeight: 200 }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.75rem", color: "#64748b" }}>Preview</h3>
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            {formData.feed_image_1 ? (
              <img src={formData.feed_image_1} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e2e8f0", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "1.5rem" }}>?</div>
            )}
            <p style={{ margin: "0.5rem 0 0", fontWeight: 600, fontSize: "1rem" }}>{formData.site_name || "Seu Nome"}</p>
            {formData.bio && (() => { const t = String(formData.bio).replace(/<[^>]+>/g, ""); return <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4, maxHeight: 48, overflow: "hidden", textOverflow: "ellipsis" }}>{t.slice(0, 80)}{t.length > 80 ? "…" : ""}</p>; })()}
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>{previewSlug ? `trustbank.xyz/s/${previewSlug}` : "trustbank.xyz"}</p>
          </div>
          {previewSlug && (
            <Link href={`/s/${previewSlug}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: "0.75rem", textAlign: "center", padding: "0.5rem", background: "#f1f5f9", borderRadius: 8, fontSize: "0.85rem", color: "#475569", textDecoration: "none" }}>Ver mini site →</Link>
          )}
        </aside>
      </div>
    </main>
  );
}
