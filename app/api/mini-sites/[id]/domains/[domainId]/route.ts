import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** GET /api/mini-sites/[id]/domains/[domainId] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; domainId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { domainId } = await params;
  const domain = await prisma.listedDomain.findFirst({
    where: { id: domainId },
  });
  if (!domain) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(domain);
}

/** PATCH — atualiza domínio */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; domainId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { domainId } = await params;
  const body = (await request.json()) as {
    name?: string;
    price?: string;
    description?: string;
    link?: string;
    status?: string;
  };
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.price !== undefined) data.price = body.price?.trim() || null;
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.link !== undefined) data.link = body.link?.trim() || null;
  if (body.status !== undefined) data.status = ["available", "sold", "reserved"].includes(body.status) ? body.status : "available";
  if (Object.keys(data).length === 0) {
    const current = await prisma.listedDomain.findUnique({ where: { id: domainId } });
    return NextResponse.json(current);
  }
  const updated = await prisma.listedDomain.update({
    where: { id: domainId },
    data: data as { name?: string; price?: string | null; description?: string | null; link?: string | null; status?: string },
  });
  return NextResponse.json(updated);
}

/** DELETE — remove domínio */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; domainId: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { domainId } = await params;
  await prisma.listedDomain.delete({ where: { id: domainId } });
  return NextResponse.json({ ok: true });
}
