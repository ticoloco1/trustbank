import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/videos/[id] — vídeo público por id (uuid) ou youtube_id.
 * Query: ?wallet=0x... para incluir hasAccess no payload (paywall).
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

  const video = await prisma.video.findFirst({
    where: {
      OR: [{ id: id }, { youtube_id: id }],
    },
    select: {
      id: true,
      youtube_id: true,
      title: true,
      thumbnail_url: true,
      paywall_enabled: true,
      paywall_price_usdc: true,
    },
  });

  if (!video) return NextResponse.json(null, { status: 404 });

  const out: Record<string, unknown> = { ...video };

  if (viewerId && video.paywall_enabled) {
    const unlock = await prisma.videoUnlock.findUnique({
      where: {
        video_id_viewer_id: { video_id: video.id, viewer_id: viewerId },
      },
    });
    (out as Record<string, unknown>).hasAccess = !!unlock;
  } else if (video.paywall_enabled) {
    (out as Record<string, unknown>).hasAccess = false;
  }

  return NextResponse.json(out);
}
