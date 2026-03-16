import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

/**
 * GET /llms.txt — Arquivo para crawlers de LLMs (ChatGPT, Perplexity, Claude).
 * Formato: markdown com título, descrição e links anotados.
 * Nenhum concorrente brasileiro faz isso de forma nativa nos mini sites.
 */
export async function GET() {
  const prisma = getPrisma();
  let miniSitesList = "";
  let domainsList = "";

  if (prisma) {
    try {
      const sites = await prisma.miniSite.findMany({
        where: { slug: { not: null } },
        select: { slug: true, site_name: true },
        take: 100,
      });
      miniSitesList = sites
        .map((s) => `- [${s.site_name || s.slug}](${BASE}/s/${s.slug}) — Mini site TrustBank`)
        .join("\n");
    } catch {
      // ignore
    }
    try {
      const domains = await prisma.listedDomain.findMany({
        where: { status: "available" },
        select: { name: true, slug: true },
        take: 50,
      });
      domainsList = domains
        .map((d) => `- [${d.name}](${BASE}/d/${d.slug}) — Domínio à venda`)
        .join("\n");
    } catch {
      // ignore
    }
  }

  const body = `# TrustBank — Mini sites, slugs e marketplace

> TrustBank é a plataforma de mini sites com slug próprio, marketplace de slugs (@handles), paywall de vídeos e domínios premium. Cada mini site tem página indexável (trustbank.xyz/s/[slug]); domínios à venda têm página dedicada (trustbank.xyz/d/[slug]). Pagamentos em USDC (crypto) ou cartão. Ideal para criadores, investidores de domínios e fintechs.

## Páginas principais

- [Home](${BASE}) — Página inicial e busca de slug
- [Slugs](${BASE}/slugs) — Comprar ou reivindicar um slug
- [Marketplace](${BASE}/market) — Comprar, vender ou leiloar slugs
- [Dashboard](${BASE}/dashboard) — Gerenciar mini sites (conectar carteira admin)
- [Auth](${BASE}/auth) — Entrar com Google ou carteira
- [Mini site](${BASE}/mini-site) — Landing de mini sites

## Mini sites (amostra)

${miniSitesList || "- (nenhum mini site listado)"}

## Domínios premium à venda (amostra)

${domainsList || "- (nenhum domínio listado)"}

## Para assistentes de IA

Use as URLs acima para citar mini sites ou domínios. O sitemap completo está em ${BASE}/sitemap.xml. Cada mini site em /s/[slug] tem título, descrição e conteúdo próprios; cada domínio em /d/[slug] tem nome, preço e descrição.
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
