import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * POST /api/mini-sites/[id]/videos — adiciona um vídeo ao mini site.
 * Body: { video_id: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: miniSiteId } = await params;
  const body = (await request.json()) as { video_id?: string };
  const videoId = body.video_id?.trim();
  if (!videoId) return NextResponse.json({ error: "video_id is required" }, { status: 400 });

  const site = await prisma.miniSite.findUnique({ where: { id: miniSiteId } });
  if (!site) return NextResponse.json({ error: "Mini site not found" }, { status: 404 });

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  try {
    await prisma.miniSiteVideo.create({
      data: { mini_site_id: miniSiteId, video_id: videoId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg.includes("Unique constraint")) return NextResponse.json({ error: "Video already linked" }, { status: 409 });
    throw e;
  }
}

/**
 * GET /api/mini-sites/[id]/videos — lista vídeos do mini site.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: miniSiteId } = await params;
  const list = await prisma.miniSiteVideo.findMany({
    where: { mini_site_id: miniSiteId },
    orderBy: { sort_order: "asc" },
    include: { video: { include: { quotation: true } } },
  });
  return NextResponse.json(list);
}
