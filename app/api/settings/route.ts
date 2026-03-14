import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const DEFAULTS = {
  platform_name: "TrustBank",
  logo_url: null as string | null,
  hero_text: null as string | null,
  grid_columns: 4,
};

export type SettingsPayload = {
  platform_name?: string;
  logo_url?: string | null;
  hero_text?: string | null;
  grid_columns?: number;
};

export async function GET() {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json(DEFAULTS);
    }
    const row = await prisma.platformSetting.findFirst({
      where: { id: 1 },
    });
    if (!row) {
      return NextResponse.json(DEFAULTS);
    }
    return NextResponse.json({
      platform_name: row.platform_name ?? DEFAULTS.platform_name,
      logo_url: row.logo_url ?? DEFAULTS.logo_url,
      hero_text: row.hero_text ?? DEFAULTS.hero_text,
      grid_columns: row.grid_columns ?? DEFAULTS.grid_columns,
      updated_at: row.updated_at,
    });
  } catch (e) {
    console.error("[api/settings]", e);
    return NextResponse.json(DEFAULTS);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Prisma not configured" }, { status: 503 });
    }
    const body = (await request.json()) as SettingsPayload;
    const data: Record<string, unknown> = {};
    if (body.platform_name !== undefined) data.platform_name = body.platform_name;
    if (body.logo_url !== undefined) data.logo_url = body.logo_url;
    if (body.hero_text !== undefined) data.hero_text = body.hero_text;
    if (body.grid_columns !== undefined) data.grid_columns = body.grid_columns;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: true });
    }
    await prisma.platformSetting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        platform_name: (data.platform_name as string) ?? DEFAULTS.platform_name,
        logo_url: (data.logo_url as string | null) ?? null,
        hero_text: (data.hero_text as string | null) ?? null,
        grid_columns: (data.grid_columns as number) ?? DEFAULTS.grid_columns,
      },
      update: data as { platform_name?: string; logo_url?: string | null; hero_text?: string | null; grid_columns?: number },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/settings PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
