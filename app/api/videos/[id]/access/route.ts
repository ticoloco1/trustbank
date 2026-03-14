import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/videos/[id]/access?wallet=0x... — verifica se a carteira tem acesso ao vídeo (paywall).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const wallet = request.nextUrl.searchParams.get("wallet")?.toLowerCase();
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase();
  const viewerId = wallet || (email ? `email:${email}` : null);
  if (!viewerId) {
    return NextResponse.json({ hasAccess: false });
  }

  const video = await prisma.video.findFirst({
    where: { OR: [{ id: id }, { youtube_id: id }] },
    select: { id: true, paywall_enabled: true },
  });
  if (!video) return NextResponse.json({ hasAccess: false });
  if (!video.paywall_enabled) return NextResponse.json({ hasAccess: true });

  const unlock = await prisma.videoUnlock.findUnique({
    where: {
      video_id_viewer_id: { video_id: video.id, viewer_id: viewerId },
    },
  });
  return NextResponse.json({ hasAccess: !!unlock });
}
