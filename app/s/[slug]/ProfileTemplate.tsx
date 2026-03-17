"use client";

import Link from "next/link";
import SafeImage from "./SafeImage";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";

type Idea = { id: string; title: string | null; content: string | null; image_url: string | null };

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  primary_color: string | null;
  theme: string | null;
  feed_image_1?: string | null;
  ideas: Idea[];
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

  return (
    <div className={`tb-profile-wrap ${theme}`} style={{ ["--tb-primary" as string]: primary }}>
      {slug && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}
      <div className="tb-profile-container">
        {avatar && <SafeImage src={avatar} alt={name} className="tb-profile-avatar" />}
        <h1 className="tb-profile-name">{name}</h1>
        {tagline && <p className="tb-profile-tagline">{tagline}</p>}
        {slug && <p className="tb-profile-username">trustbank.xyz/s/{slug}</p>}
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
