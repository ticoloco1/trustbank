"use client";

import Link from "next/link";
import SafeImage from "./SafeImage";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";

type Idea = { id: string; title: string | null; content: string | null; image_url: string | null };

const AVATAR_SIZES = { P: 64, M: 96, G: 128, GG: 160 } as const;
const FONT_SIZES = { small: "0.875rem", medium: "1rem", large: "1.125rem" } as const;

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  primary_color: string | null;
  theme: string | null;
  feed_image_1?: string | null;
  ideas: Idea[];
  text_color?: string | null;
  heading_color?: string | null;
  font_size_base?: string | null;
  avatar_size?: string | null;
  badge_type?: string | null;
};

const THEMES = ["theme-dark-neon", "theme-light-minimal", "theme-sunset", "theme-forest", "theme-ocean"] as const;

export default function ProfileTemplate({ site }: { site: Site }) {
  const theme = site.theme && THEMES.includes(site.theme as (typeof THEMES)[number])
    ? site.theme
    : "theme-dark-neon";
  const primary = site.primary_color ?? "#6c63ff";
  const slug = site.slug ?? "";
  const name = site.site_name || slug.replace(/^@/, "") || "Perfil";
  const tagline = site.bio || "";
  const avatar = site.feed_image_1;
  const links = site.ideas.filter((i) => i.title && i.content && (i.content.startsWith("http") || i.content.startsWith("/")));
  const avatarSize = (site.avatar_size && site.avatar_size in AVATAR_SIZES ? AVATAR_SIZES[site.avatar_size as keyof typeof AVATAR_SIZES] : 96) as number;
  const textColor = site.text_color ?? undefined;
  const headingColor = site.heading_color ?? primary;
  const fontSize = FONT_SIZES[(site.font_size_base as keyof typeof FONT_SIZES) ?? "medium"];
  const badge = site.badge_type === "blue" || site.badge_type === "gold" ? site.badge_type : null;

  return (
    <div className={`tb-profile-wrap ${theme}`} style={{ ["--tb-primary" as string]: primary, color: textColor, fontSize }}>
      {slug && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}
      <div className="tb-profile-container">
        {avatar && (
          <SafeImage
            src={avatar}
            alt={name}
            className="tb-profile-avatar"
            style={{ width: avatarSize, height: avatarSize, minWidth: avatarSize, minHeight: avatarSize }}
          />
        )}
        <h1 className="tb-profile-name" style={{ color: headingColor, fontSize: badge ? "1.35rem" : undefined }}>
          {name}
          {badge === "blue" && <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", width: 20, height: 20, borderRadius: "50%", background: "#3b82f6", color: "#fff", fontSize: 12 }} title="Verificado">✓</span>}
          {badge === "gold" && <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#fff", fontSize: 12 }} title="Empresa">★</span>}
        </h1>
        {tagline && <p className="tb-profile-tagline" style={textColor ? { color: textColor, opacity: 0.9 } : undefined}>{tagline}</p>}
        {slug && <p className="tb-profile-username">trustbank.xyz/@{slug.replace(/^@/, "")}</p>}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
          {links.map((idea) => (
            <a
              key={idea.id}
              href={idea.content!.trim().startsWith("/") ? `https://trustbank.xyz${idea.content}` : idea.content!.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="tb-link-button solid"
              style={{ ["--tb-primary" as string]: primary }}
            >
              {idea.title}
            </a>
          ))}
        </div>
        <div className="tb-profile-footer">TrustBank · Mini site</div>
      </div>
    </div>
  );
}
