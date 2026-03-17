"use client";

import Link from "next/link";
import SafeImage from "./SafeImage";
import MiniSiteGoogleBanner from "./MiniSiteGoogleBanner";

type ExtraPage = { id: string; title: string; page_slug: string; content_html: string | null };

const AVATAR_SIZES = { P: 64, M: 96, G: 128, GG: 160 } as const;
const FONT_SIZES = { small: "0.875rem", medium: "1rem", large: "1.125rem" } as const;

type Site = {
  site_name: string | null;
  slug: string | null;
  bio: string | null;
  primary_color: string | null;
  banner_url?: string | null;
  feed_image_1?: string | null;
  extra_pages?: ExtraPage[];
  cv_contact_email?: string | null;
  cv_contact_phone?: string | null;
  cv_contact_whatsapp?: string | null;
  text_color?: string | null;
  heading_color?: string | null;
  font_size_base?: string | null;
  avatar_size?: string | null;
  badge_type?: string | null;
};

/** Estado do desbloqueio: guest = visitante; company_* = empresa autenticada; unlocked = já desbloqueado por esta empresa */
type UnlockState = "guest" | "company_with_unlocks" | "company_no_unlocks" | "unlocked";

const UNLOCK_PRICE = "20,00";
const CANDIDATE_SHARE = "10";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "✉️ ●●●●●●●@●●●●●.com";
  const [local, domain] = email.split("@");
  const m = Math.max(1, Math.floor(local.length / 2));
  return `✉️ ${"●".repeat(m)}${local.slice(-2)}@●●●●●.${domain.split(".").pop() || "com"}`;
}
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "📱 (●●) ●●●●●-●●●●";
  return `📱 (●●) ●●●●●-${digits.slice(-4)}`;
}
function maskWhatsApp(wa: string): string {
  const d = wa.replace(/\D/g, "");
  return `💬 WhatsApp ●●●●●●●●●●●`;
}

export default function CVProTemplate({
  site,
  unlockState = "guest",
  remainingUnlocks,
}: {
  site: Site;
  unlockState?: UnlockState;
  remainingUnlocks?: number;
}) {
  const slug = site.slug ?? "";
  const name = site.site_name || slug.replace(/^@/, "") || "Currículo";
  const headline = site.bio || "";
  const primary = site.primary_color ?? "#0a66c2";
  const sections = site.extra_pages ?? [];
  const email = site.cv_contact_email?.trim();
  const phone = site.cv_contact_phone?.trim();
  const whatsapp = site.cv_contact_whatsapp?.trim();
  const hasContact = !!(email || phone || whatsapp);
  const avatarSize = (site.avatar_size && site.avatar_size in AVATAR_SIZES ? AVATAR_SIZES[site.avatar_size as keyof typeof AVATAR_SIZES] : 96) as number;
  const textColor = site.text_color ?? undefined;
  const headingColor = site.heading_color ?? primary;
  const fontSize = FONT_SIZES[(site.font_size_base as keyof typeof FONT_SIZES) ?? "medium"];
  const badge = site.badge_type === "blue" || site.badge_type === "gold" ? site.badge_type : null;

  return (
    <div
      className="tb-cv-wrap"
      style={{ ["--cv-primary" as string]: primary, color: textColor, fontSize }}
    >
      {slug && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <MiniSiteGoogleBanner slug={slug} />
        </div>
      )}
      <div className="tb-cv-wrapper">
        <header className="tb-cv-header">
          <div className="tb-cv-cover" style={site.banner_url ? { padding: 0, overflow: "hidden" } : { background: `linear-gradient(135deg, ${primary}, #0d8ecf)` }}>
            {site.banner_url && <SafeImage src={site.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div className="tb-cv-header-content">
            {site.feed_image_1 && (
              <SafeImage
                src={site.feed_image_1}
                alt={name}
                className="tb-cv-avatar"
                style={{ width: avatarSize, height: avatarSize, minWidth: avatarSize, minHeight: avatarSize }}
              />
            )}
            <h1 className="tb-cv-name" style={{ color: headingColor }}>
              {name}
              {badge === "blue" && <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", width: 20, height: 20, borderRadius: "50%", background: "#3b82f6", color: "#fff", fontSize: 12 }} title="Verificado">✓</span>}
              {badge === "gold" && <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#fff", fontSize: 12 }} title="Empresa">★</span>}
            </h1>
            {headline && <p className="tb-cv-headline" style={textColor ? { color: textColor } : undefined}>{headline}</p>}
          </div>
        </header>
        {sections.map((page) => (
          <section key={page.id} className="tb-cv-section">
            <h2 className="tb-cv-section-title">{page.title}</h2>
            {page.content_html && (
              <div dangerouslySetInnerHTML={{ __html: page.content_html }} style={{ fontSize: "0.95rem", lineHeight: 1.6 }} />
            )}
          </section>
        ))}

        {/* Bloco de contato: 4 estados conforme cv-locked-contact.md */}
        {unlockState === "unlocked" && hasContact ? (
          <section className="tb-cv-unlocked-section">
            <span style={{ fontWeight: 700, color: "#46d369" }}>🔓 Contato desbloqueado</span>
            <div className="tb-cv-contact-fields">
              {email && <a href={`mailto:${email}`}>✉️ {email}</a>}
              {phone && <a href={`tel:${phone}`}>📱 {phone}</a>}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  💬 WhatsApp
                </a>
              )}
            </div>
          </section>
        ) : (
          <section className="tb-cv-locked-section">
            <div className="tb-cv-lock-icon" aria-hidden>🔒</div>
            <p style={{ margin: 0, color: "var(--cv-muted)", fontSize: "0.9rem" }}>Contato protegido</p>
            {hasContact && (
              <div className="tb-cv-locked-fields">
                {email && <div className="tb-cv-locked-field">{maskEmail(email)}</div>}
                {phone && <div className="tb-cv-locked-field">{maskPhone(phone)}</div>}
                {whatsapp && <div className="tb-cv-locked-field">{maskWhatsApp(whatsapp)}</div>}
              </div>
            )}
            {unlockState === "guest" && (
              <>
                <Link
                  href="/auth"
                  className="tb-cv-unlock-btn"
                  style={{ display: "block", textAlign: "center", textDecoration: "none", color: "#fff" }}
                >
                  🔓 Sou empresa — quero contratar
                </Link>
                <p className="tb-cv-unlock-incentive">Faça login para desbloquear este contato</p>
              </>
            )}
            {unlockState === "company_with_unlocks" && (
              <>
                <Link
                  href={`/api/cv-unlock?site=${slug}`}
                  className="tb-cv-unlock-btn"
                  style={{ display: "block", textAlign: "center", textDecoration: "none", color: "#fff" }}
                >
                  🔓 Desbloquear Contato — US$ {UNLOCK_PRICE}
                </Link>
                <p className="tb-cv-unlock-incentive">💚 US$ {CANDIDATE_SHARE} vão diretamente para este profissional</p>
                {typeof remainingUnlocks === "number" && (
                  <p className="tb-cv-unlock-remaining">Você tem {remainingUnlocks} desbloqueios restantes neste mês</p>
                )}
              </>
            )}
            {unlockState === "company_no_unlocks" && (
              <>
                <Link
                  href={`/api/cv-unlock?site=${slug}&extra=1`}
                  className="tb-cv-unlock-btn btn-extra"
                  style={{ display: "block", textAlign: "center", textDecoration: "none", color: "#fff" }}
                >
                  🔓 Desbloquear — US$ {UNLOCK_PRICE} (desbloqueio extra)
                </Link>
                <p className="tb-cv-unlock-note">
                  Seus 20 desbloqueios mensais foram usados. Cada extra custa US$ {UNLOCK_PRICE} (US$ {CANDIDATE_SHARE} para o candidato).
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
