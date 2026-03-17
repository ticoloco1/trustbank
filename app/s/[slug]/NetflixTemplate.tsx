"use client";

import Link from "next/link";
import SafeImage from "./SafeImage";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";

type VideoItem = {
  video: {
    id: string;
    youtube_id: string;
    title: string | null;
    thumbnail_url: string | null;
    quotation?: { total_shares: number; valuation_usdc: string | null } | null;
  };
};

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  banner_url?: string | null;
  mini_site_videos?: VideoItem[];
};

export default function NetflixTemplate({ site }: { site: Site }) {
  const slug = site.slug ?? "";
  const title = site.site_name || slug.replace(/^@/, "") || "Vídeos";
  const description = site.bio || "";
  const videos = site.mini_site_videos ?? [];
  const thumb = (v: VideoItem) =>
    v.video.thumbnail_url || `https://img.youtube.com/vi/${v.video.youtube_id}/mqdefault.jpg`;

  return (
    <div className="tb-netflix-wrap">
      {slug && (
        <div style={{ position: "fixed", top: 16, right: "4%", zIndex: 101 }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}
      <header className="tb-header" id="tb-netflix-header">
        <Link href="/" className="tb-logo">TrustBank</Link>
      </header>
      <section className="tb-hero-banner">
        {site.banner_url ? (
          <SafeImage src={site.banner_url} alt="" className="tb-hero-backdrop" />
        ) : (
          <div className="tb-hero-backdrop" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #e50914 100%)" }} />
        )}
        <div className="tb-hero-overlay" />
        <div className="tb-hero-content">
          <h1 className="tb-hero-title">{title}</h1>
          {description && <p className="tb-hero-description">{description}</p>}
        </div>
      </section>
      {videos.length > 0 && (
        <div className="tb-category-row" style={{ paddingLeft: "4%", paddingRight: "4%" }}>
          <h2 className="tb-category-title">Vídeos</h2>
          <div className="tb-cards-scroll">
            {videos.map((item) => (
              <Link
                key={item.video.id}
                href={`/v/${item.video.id}`}
                className="tb-video-card"
              >
                <img src={thumb(item)} alt={item.video.title || "Vídeo"} />
                <span className={`tb-video-badge ${item.video.quotation ? "paid" : "free"}`}>
                  {item.video.quotation ? "Paywall" : "Grátis"}
                </span>
                <div className="tb-video-card-info">
                  <span className="tb-video-card-title">{item.video.title || "Assistir"}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {videos.length === 0 && (
        <div style={{ padding: "3rem 4%", color: "#808080", textAlign: "center" }}>
          Nenhum vídeo ainda. Adicione no dashboard.
        </div>
      )}
    </div>
  );
}
