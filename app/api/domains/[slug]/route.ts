import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/domains/[slug] — domínio por slug (para página pública /d/[slug]) */
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json(null, { status: 503 });
  const { slug } = await params;
  const domain = await prisma.listedDomain.findUnique({
    where: { slug },
    include: { mini_site: { select: { id: true, site_name: true, slug: true } } },
  });
  if (!domain) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(domain);
}
