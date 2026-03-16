import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * DELETE /api/mini-sites/[id]/videos/[videoId] — remove vídeo do mini site.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id: miniSiteId, videoId } = await params;
  await prisma.miniSiteVideo.deleteMany({
    where: { mini_site_id: miniSiteId, video_id: videoId },
  });
  return NextResponse.json({ ok: true });
}
