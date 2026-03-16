"use client";

import Link from "next/link";
import { VideoFlipCard } from "@/components/VideoFlipCard";
import { BrokerSection } from "@/components/BrokerSection";

type VideoWithQuotation = {
  video: {
    id: string;
    youtube_id: string;
    title: string | null;
    thumbnail_url: string | null;
    quotation?: {
      total_shares: number;
      valuation_usdc: string | null;
      ticker_symbol: string | null;
      revenue_usdc: string | null;
    } | null;
  };
};

type Props = {
  miniSiteSlug: string;
  primaryColor?: string | null;
  clubNftName?: string | null;
  videos: VideoWithQuotation[];
};

export default function MiniSiteVideosSection({ miniSiteSlug, primaryColor, clubNftName, videos }: Props) {
  if (videos.length === 0) return null;

  return (
    <section style={{ marginTop: "2rem", padding: "1rem 0" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontWeight: 700 }}>Vídeos — cotação e shares</h2>
      <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1rem" }}>
        Clique no card para ver a frente (vídeo) ou o verso (cotação). Negociação de shares na corretora abaixo.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {videos.map(({ video }) => (
          <VideoFlipCard
            key={video.id}
            videoId={video.id}
            youtubeId={video.youtube_id}
            title={video.title}
            thumbnailUrl={video.thumbnail_url}
            totalShares={video.quotation?.total_shares ?? 1_000_000}
            valuationUsdc={video.quotation?.valuation_usdc}
            tickerSymbol={video.quotation?.ticker_symbol}
            revenueUsdc={video.quotation?.revenue_usdc}
            primaryColor={primaryColor ?? "#1e3a8a"}
          />
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Link href={`/s/${miniSiteSlug}/videos`} style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
          Ver todos os vídeos deste negócio →
        </Link>
      </div>

      <BrokerSection
        miniSiteSlug={miniSiteSlug}
        clubNftName={clubNftName}
        videoId={videos[0]?.video.id}
        videoTitle={videos[0]?.video.title}
        videoTicker={videos[0]?.video.quotation?.ticker_symbol}
      />
    </section>
  );
}
