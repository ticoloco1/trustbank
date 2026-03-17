import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * User-Agents de crawlers que recebem HTML pré-renderizado do cache (KV).
 * Inclui Google, Bing, redes sociais e crawlers de LLMs (ChatGPT, Perplexity, Claude).
 */
const BOT_UA =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|chatgpt-user|perplexitybot|claudebot|anthropic-ai|cohere-ai|bytespider|petalbot/i;

/** Paths que podem ter cache de prerender (mini sites, domínios, home). */
function shouldPrerenderCache(pathname: string): boolean {
  if (pathname === "/" || pathname === "/slugs" || pathname === "/market") return true;
  if (pathname.startsWith("/s/") || pathname.startsWith("/d/")) return true;
  if (pathname.startsWith("/@")) return true; // trustbank.xyz/@slug
  return false;
}

/** Normaliza path para chave do cache: /@slug → /s/slug (mesmo conteúdo). */
function cacheKeyForPath(pathname: string): string {
  if (pathname.startsWith("/@")) {
    const m = pathname.match(/^\/@([^/]+)(\/.*)?$/);
    return m ? `/s/${m[1]}${m[2] ?? ""}` : pathname;
  }
  return pathname;
}

/** Rewrite /@slug e /@slug/... para /s/slug (mesmo conteúdo; URL do browser fica /@). */
function rewriteAtPath(pathname: string): string | null {
  const m = pathname.match(/^\/@([^/]+)(\/.*)?$/);
  if (!m) return null;
  const slug = m[1];
  const rest = m[2] ?? "";
  return `/s/${slug}${rest}`;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redireciona /s/slug → /@slug para que a URL canônica seja sempre /@
  const sMatch = pathname.match(/^\/s\/([^/]+)(\/.*)?$/);
  if (sMatch) {
    const slug = (sMatch[1] || "").replace(/^@/, "");
    const rest = sMatch[2] ?? "";
    const url = request.nextUrl.clone();
    url.pathname = slug ? `/@${slug}${rest}` : pathname;
    if (slug) return NextResponse.redirect(url, 301);
  }

  // Slugs só em /@ — reescreve para /s/ internamente (URL permanece /@slug)
  const rewriteTo = rewriteAtPath(pathname);
  if (rewriteTo) {
    const isBot = /googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|chatgpt-user|perplexitybot/i.test(request.headers.get("user-agent") ?? "");
    if (isBot) {
      try {
        const { kv } = await import("@vercel/kv");
        const html = await kv.get<string>(`prerender:${rewriteTo}`);
        if (html && typeof html === "string") {
          return new NextResponse(html, {
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
          });
        }
      } catch {
        // segue para rewrite
      }
    }
    const url = request.nextUrl.clone();
    url.pathname = rewriteTo;
    return NextResponse.rewrite(url);
  }

  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (!BOT_UA.test(ua)) return NextResponse.next();
    if (!shouldPrerenderCache(pathname)) return NextResponse.next();

    const key = `prerender:${cacheKeyForPath(pathname)}`;

    try {
      const { kv } = await import("@vercel/kv");
      const html = await kv.get<string>(key);
      if (html && typeof html === "string") {
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
    } catch {
      // KV não configurado ou erro: deixa o request seguir (SSR normal)
    }

    return NextResponse.next();
  } catch {
    // Qualquer falha no middleware: não quebra o site, deixa a request seguir
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|llms.txt|robots.txt|sitemap.xml).*)",
  ],
};
