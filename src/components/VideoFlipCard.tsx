"use client";

import { useState } from "react";
import Link from "next/link";

type VideoFlipCardProps = {
  videoId: string;
  youtubeId: string;
  title: string | null;
  thumbnailUrl: string | null;
  totalShares?: number;
  valuationUsdc?: string | null;
  tickerSymbol?: string | null;
  revenueUsdc?: string | null;
  primaryColor?: string | null;
  embedUrl?: string; // opcional: YouTube embed ou Bunny
};

export function VideoFlipCard({
  videoId,
  youtubeId,
  title,
  thumbnailUrl,
  totalShares = 1000000,
  valuationUsdc,
  tickerSymbol,
  revenueUsdc,
  primaryColor = "#1e3a8a",
  embedUrl,
}: VideoFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const embed = embedUrl ?? `https://www.youtube.com/embed/${youtubeId}?rel=0`;
  const displayValuation = valuationUsdc ? `$${Number(valuationUsdc).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";
  const displayRevenue = revenueUsdc ? `$${revenueUsdc}` : "—";

  return (
    <div
      style={{
        perspective: "1000px",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <div
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s ease",
          cursor: "pointer",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Frente: vídeo (embed ou thumbnail com link) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            background: "#0f172a",
            borderRadius: 12,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <iframe
              title={title ?? "Video"}
              src={flipped ? undefined : embed}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: 12,
              }}
            />
            {!flipped && (
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                Clique para ver cotação
              </div>
            )}
          </div>
        </div>

        {/* Verso: cotação / shares */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: primaryColor ?? "#1e3a8a",
            color: "#fff",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {tickerSymbol && (
              <span style={{ fontSize: "0.75rem", opacity: 0.9, fontWeight: 600 }}>{tickerSymbol}</span>
            )}
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.95rem", fontWeight: 600 }}>{title ?? "Video"}</p>
          </div>
          <div style={{ fontSize: "0.85rem" }}>
            <p style={{ margin: "0.25rem 0", opacity: 0.95 }}>Total de shares: {(totalShares / 1_000_000).toFixed(1)}M</p>
            <p style={{ margin: "0.25rem 0", fontWeight: 600 }}>Valor est.: {displayValuation}</p>
            {revenueUsdc && <p style={{ margin: "0.25rem 0", opacity: 0.9 }}>Receita: {displayRevenue}</p>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link
              href={`/v/${videoId}`}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#fff", textDecoration: "underline", fontSize: "0.85rem" }}
            >
              Ver vídeo
            </Link>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Clique para voltar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
