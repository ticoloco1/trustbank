import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import { getArticleBackgroundClass, articleBackgroundStyles } from "@/lib/article-page";

type Props = { params: Promise<{ slug: string; pageSlug: string }> };

export default async function MiniSitePagePage({ params }: Props) {
  const { slug, pageSlug } = await params;
  const prisma = getPrisma();
  if (!prisma) notFound();

  const site = await prisma.miniSite.findUnique({
    where: { slug },
  });
  if (!site) notFound();

  const page = await prisma.miniSitePage.findFirst({
    where: { mini_site_id: site.id, page_slug: pageSlug },
  });
  if (!page) notFound();

  const bgClass = getArticleBackgroundClass(page.background);
  const primary = site.primary_color ?? "#6366f1";

  return (
    <main
      className={bgClass}
      style={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: articleBackgroundStyles }} />
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href={`/s/${slug}`} style={{ color: primary, textDecoration: "none", fontSize: "0.9rem" }}>
            ← {site.site_name || slug}
          </Link>
        </div>
        <article>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.5rem", color: primary }}>
            {page.title}
          </h1>
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: page.content_html || "" }}
            style={{ marginTop: "1rem", lineHeight: 1.6 }}
          />
        </article>
      </div>
    </main>
  );
}
