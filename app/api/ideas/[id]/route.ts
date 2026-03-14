import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/** PATCH /api/ideas/[id] — atualizar. DELETE /api/ideas/[id] — remover */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as { title?: string; content?: string };
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (Object.keys(data).length === 0) {
    const current = await prisma.idea.findUnique({ where: { id } });
    return NextResponse.json(current);
  }
  const updated = await prisma.idea.update({
    where: { id },
    data: data as { title?: string; content?: string },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
  const { id } = await params;
  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
