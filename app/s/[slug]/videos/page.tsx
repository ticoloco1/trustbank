import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import MiniSiteVideosSection from "../MiniSiteVideosSection";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

type Props = { params: Promise<{ slug: string }> };

export default async function MiniSiteVideosPage({ params }: Props) {
  const { slug } = await params;
  const prisma = getPrisma();
  if (!prisma) notFound();

  const slugNorm = slug.replace(/^@/, "").toLowerCase();
  const site = await prisma.miniSite.findFirst({
    where: { OR: [{ slug }, { slug: slugNorm }, { slug: `@${slugNorm}` }] },
    include: {
      mini_site_videos: {
        orderBy: { sort_order: "asc" },
        include: { video: { include: { quotation: true } } },
      },
    },
  });

  if (!site) notFound();

  const videos = (site as { mini_site_videos: { video: { id: string; youtube_id: string; title: string | null; thumbnail_url: string | null; quotation?: { total_shares: number; valuation_usdc: string | null; ticker_symbol: string | null; revenue_usdc: string | null } | null } }[] }).mini_site_videos ?? [];
  const primary = site.primary_color ?? "#1e3a8a";

  return (
    <main style={{ fontFamily: "system-ui", minHeight: "100vh", background: site.bg_color ?? "#f8fafc", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: primary, textDecoration: "none", fontSize: "0.9rem" }}>← TrustBank</Link>
          <span style={{ margin: "0 0.5rem", color: "#94a3b8" }}>/</span>
          <Link href={`/s/${site.slug}`} style={{ color: primary, textDecoration: "none", fontSize: "0.9rem" }}>{site.site_name || site.slug || slug}</Link>
        </div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Todos os vídeos</h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          Vídeos que fazem parte deste negócio. Clique no card para ver o vídeo ou a cotação (shares).
        </p>
        <MiniSiteVideosSection
          miniSiteSlug={site.slug ?? slug}
          primaryColor={site.primary_color}
          clubNftName={(site as { club_nft_name?: string | null }).club_nft_name}
          videos={videos}
        />
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const prisma = getPrisma();
  if (!prisma) return { title: "Vídeos | TrustBank" };
  const site = await prisma.miniSite.findFirst({
    where: { OR: [{ slug }, { slug: slug.replace(/^@/, "").toLowerCase() }, { slug: `@${slug.replace(/^@/, "").toLowerCase()}` }] },
  });
  const name = site?.site_name || site?.slug || slug;
  return {
    title: `Vídeos — ${name} | TrustBank`,
    description: `Vídeos e cotação de shares de ${name}.`,
  };
}
