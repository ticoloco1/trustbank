"use client";

import { useEffect, useRef } from "react";

/**
 * Registra page view no analytics quando o usuário entra no mini site ou em uma página.
 * Gera um visitor_key simples em sessionStorage para contar visitantes únicos por sessão.
 */
export default function AnalyticsTracker({
  miniSiteId,
  path = "/",
}: {
  miniSiteId: string;
  path?: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (!miniSiteId || sent.current) return;
    sent.current = true;

    let visitorKey: string | null = null;
    try {
      const key = "tb_vk";
      visitorKey = sessionStorage.getItem(key);
      if (!visitorKey) {
        visitorKey = `s_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
        sessionStorage.setItem(key, visitorKey);
      }
    } catch {
      // ignore
    }

    const referrer =
      typeof document !== "undefined" && document.referrer
        ? (() => {
            try {
              const u = new URL(document.referrer);
              return u.origin === window.location.origin ? "internal" : document.referrer.slice(0, 500);
            } catch {
              return document.referrer.slice(0, 500);
            }
          })()
        : null;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mini_site_id: miniSiteId,
        path: path || "/",
        event_type: "page_view",
        visitor_key: visitorKey,
        referrer: referrer || "direct",
      }),
    }).catch(() => {});
  }, [miniSiteId, path]);

  return null;
}
