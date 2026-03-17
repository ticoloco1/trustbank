/**
 * URLs de mini sites: só /@ (ex.: /@ary, /@empresa).
 * Slug no DB pode ser "ary" ou "@ary"; na URL sempre /@valor sem @ duplicado.
 */
export function minisiteBasePath(slug: string | null | undefined): string {
  if (!slug) return "/";
  const norm = slug.replace(/^@/, "");
  return norm ? `/@${norm}` : "/";
}

export function minisitePagePath(slug: string | null | undefined, pageSlug: string): string {
  const base = minisiteBasePath(slug);
  return base === "/" ? "/" : `${base}/p/${pageSlug}`;
}

export function minisiteVideosPath(slug: string | null | undefined): string {
  const base = minisiteBasePath(slug);
  return base === "/" ? "/" : `${base}/videos`;
}
