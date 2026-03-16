"use client";

import { useState } from "react";

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return `https://${t}`;
}

type SafeImageProps = {
  src: string | null | undefined;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  fill?: boolean;
};

/**
 * Exibe imagem com URL normalizada (https) e fallback em erro para não quebrar o layout.
 */
export default function SafeImage({ src, alt = "", style = {}, className, fill }: SafeImageProps) {
  const [error, setError] = useState(false);
  const normalized = normalizeImageUrl(src);

  if (!normalized || error) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: "0.75rem",
        }}
        aria-hidden
      >
        {!normalized ? "No image" : "Image unavailable"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={normalized}
      alt={alt}
      style={style}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
      decoding="async"
    />
  );
}

export { normalizeImageUrl };
