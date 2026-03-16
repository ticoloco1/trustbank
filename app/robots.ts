import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank.xyz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/auth", "/governance"] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
