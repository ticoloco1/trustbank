import { getPrisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/slugs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/market`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/dashboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/auth`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/mini-site`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const prisma = getPrisma();
  if (!prisma) return base;

  try {
    const sites = await prisma.miniSite.findMany({
      where: { slug: { not: null } },
      select: { slug: true, updated_at: true },
    });
    const miniSiteUrls: MetadataRoute.Sitemap = sites.map((s) => ({
      url: `${BASE_URL}/@${encodeURIComponent((s.slug || "").replace(/^@/, ""))}`,
      lastModified: s.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const domains = await prisma.listedDomain.findMany({
      where: { status: "available" },
      select: { slug: true, updated_at: true },
    });
    const domainUrls: MetadataRoute.Sitemap = domains.map((d) => ({
      url: `${BASE_URL}/d/${encodeURIComponent(d.slug)}`,
      lastModified: d.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...base, ...miniSiteUrls, ...domainUrls];
  } catch {
    return base;
  }
}
