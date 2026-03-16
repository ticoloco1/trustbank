import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prisma = getPrisma();
  if (!prisma) return { title: "Domain | TrustBank" };

  const domain = await prisma.listedDomain.findUnique({
    where: { slug },
    include: { mini_site: { select: { site_name: true, slug: true } } },
  });
  if (!domain) return { title: `${slug} | TrustBank` };

  const title = `${domain.name} — Premium Domain${domain.mini_site?.site_name ? ` | ${domain.mini_site.site_name}` : ""} | TrustBank`;
  const description =
    domain.description?.slice(0, 160) ||
    `Premium domain ${domain.name} for sale${domain.price ? ` — $${domain.price}` : ""}.`;
  const url = `${BASE_URL}/d/${domain.slug}`;

  return {
    title,
    description,
    openGraph: { title, description, url, siteName: "TrustBank", type: "website" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: url },
  };
}

export default async function DomainPage({ params }: Props) {
  const { slug } = await params;
  const prisma = getPrisma();
  if (!prisma) notFound();

  const domain = await prisma.listedDomain.findUnique({
    where: { slug },
    include: { mini_site: { select: { id: true, site_name: true, slug: true } } },
  });
  if (!domain) notFound();

  const siteName = domain.mini_site?.site_name || domain.mini_site?.slug || "TrustBank";
  const siteSlug = domain.mini_site?.slug;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: domain.name,
    description: domain.description || `Premium domain ${domain.name} for sale.`,
    ...(domain.price ? { offers: { "@type": "Offer", price: domain.price, priceCurrency: "USD" } } : {}),
  };

  return (
    <main style={{ fontFamily: "system-ui", minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.9rem" }}>
            ← TrustBank
          </Link>
          {siteSlug && (
            <>
              {" · "}
              <Link href={`/s/${siteSlug}`} style={{ color: "#0d9488", textDecoration: "none", fontSize: "0.9rem" }}>
                {siteName}
              </Link>
            </>
          )}
        </div>
        <article style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#0f172a" }}>{domain.name}</h1>
          {domain.price && (
            <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0d9488", marginBottom: "1rem" }}>
              ${domain.price}
            </p>
          )}
          {domain.description && (
            <div
              style={{ color: "#475569", lineHeight: 1.6, marginBottom: "1.5rem", whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: domain.description.replace(/\n/g, "<br />") }}
            />
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {domain.link && (
              <a
                href={domain.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 18px",
                  background: "#0d9488",
                  color: "#fff",
                  borderRadius: 8,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                Buy now
              </a>
            )}
            <span style={{ padding: "10px 18px", border: "1px solid #0d9488", color: "#0d9488", borderRadius: 8, fontSize: "0.95rem" }}>
              Make offer — contact via mini site
            </span>
          </div>
        </article>
        {siteSlug && (
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#64748b" }}>
            <Link href={`/s/${siteSlug}`} style={{ color: "#0d9488", textDecoration: "none" }}>
              ← Back to {siteName}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
