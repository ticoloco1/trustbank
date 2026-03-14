"use client";

import React, { useState } from "react";
import { SecurityHelper } from "@/lib/security-helper";

type ProtectedPlayerProps = {
  /** ID do vídeo (pode ser o ID real ou ofuscado/invertido; use obfuscated=true se for invertido). */
  videoId: string;
  /** Se true, aplica revealId no videoId antes de usar no iframe. */
  obfuscated?: boolean;
};

export function ProtectedPlayer({ videoId, obfuscated = false }: ProtectedPlayerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const realId = obfuscated ? SecurityHelper.revealId(videoId) : videoId;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${realId}?rel=0&modestbranding=1&iv_load_policy=3&controls=1&disablekb=1`;

  return (
    <div
      className="protected-player-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "56.25%",
        background: "#000",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
      }}
    >
      {/* CAMADA 1: Bloqueador de cliques superior (protege título e link do YouTube) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 64,
          zIndex: 30,
          cursor: "default",
        }}
        aria-hidden
      />

      {/* CAMADA 2: Bloqueador de clique direito em todo o player */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          pointerEvents: isHovered ? "auto" : "none",
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden
      />

      {/* CAMADA 3: Marca d'água */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 30,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            background: "rgba(0,0,0,0.5)",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          Conteúdo Protegido — TrustBank
        </span>
      </div>

      <iframe
        src={embedUrl}
        title="Vídeo"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: 0,
          zIndex: 10,
          outline: "none",
        }}
        className="protected-player-iframe"
      />
    </div>
  );
}
