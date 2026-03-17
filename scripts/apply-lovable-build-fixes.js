#!/usr/bin/env node
/**
 * Aplica só os fixes de build no repo new-trust (para Vercel).
 * Rode DEPOIS de sincronizar o projeto do Lovable para ticoloco1/new-trust.
 *
 * Uso: node scripts/apply-lovable-build-fixes.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO_URL = "https://github.com/ticoloco1/new-trust.git";
const WORK_DIR = path.join(__dirname, "_new-trust-fix");

const STUB_SUPABASE_CLIENT = `/**
 * Stub Supabase: sem dependência de @supabase/supabase-js (build Next.js na Vercel).
 * Auth usa Prisma/API (NEXT_PUBLIC_USE_PRISMA ou sem NEXT_PUBLIC_SUPABASE_URL).
 */
type Session = {
  user: { id: string; email?: string | null; user_metadata?: { wallet_address?: string } };
} | null;

export const supabase = {
  auth: {
    getSession: async (): Promise<{ data: { session: Session } }> => ({ data: { session: null } }),
    onAuthStateChange: (_cb: () => void): { data: { subscription: { unsubscribe: () => void } } } => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: (_table: string) => ({
    select: (_cols: string) => ({
      eq: (_col: string, _val: string | number) => ({
        maybeSingle: async (): Promise<{ data: unknown; error: null }> => ({ data: null, error: null }),
      }),
    }),
    update: (_payload: unknown) => ({
      eq: (_col: string, _val: number): Promise<{ error: null }> => Promise.resolve({ error: null }),
    }),
  }),
};
`;

function run(cmd, opts = {}) {
  console.log("$", cmd);
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function replaceInFile(filePath, from, to) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(from)) {
    console.warn("Padrão não encontrado em", filePath, "- pulando");
    return false;
  }
  content = content.replace(from, to);
  fs.writeFileSync(filePath, content);
  return true;
}

function main() {
  console.log("1. Clonando new-trust em", WORK_DIR);
  if (fs.existsSync(WORK_DIR)) {
    fs.rmSync(WORK_DIR, { recursive: true });
  }
  run(`git clone --depth 1 ${REPO_URL} "${WORK_DIR}"`, { cwd: path.dirname(WORK_DIR) });

  const clientPath = path.join(WORK_DIR, "src/integrations/supabase/client.ts");
  const routePath = path.join(WORK_DIR, "app/api/mini-sites/[id]/route.ts");
  const headerPath = path.join(WORK_DIR, "src/components/GlobalHeader.tsx");

  console.log("2. Aplicando fix: stub Supabase client");
  if (fs.existsSync(clientPath)) {
    fs.writeFileSync(clientPath, STUB_SUPABASE_CLIENT);
  } else {
    console.warn("Arquivo não encontrado:", clientPath);
  }

  console.log("3. Aplicando fix: tipos em mini-sites route");
  if (fs.existsSync(routePath)) {
    replaceInFile(
      routePath,
      'data.font_size_base = ["small", "medium", "large"].includes(body.font_size_base) ? body.font_size_base : null',
      'data.font_size_base = (body.font_size_base != null && ["small", "medium", "large"].includes(body.font_size_base)) ? body.font_size_base : null'
    );
    replaceInFile(
      routePath,
      'data.avatar_size = ["P", "M", "G", "GG"].includes(body.avatar_size) ? body.avatar_size : null',
      'data.avatar_size = (body.avatar_size != null && ["P", "M", "G", "GG"].includes(body.avatar_size)) ? body.avatar_size : null'
    );
    replaceInFile(
      routePath,
      "data.badge_type = (body.badge_type === \"blue\" || body.badge_type === \"gold\") ? body.badge_type : null",
      'data.badge_type = (body.badge_type != null && (body.badge_type === "blue" || body.badge_type === "gold")) ? body.badge_type : null'
    );
  } else {
    console.warn("Arquivo não encontrado:", routePath);
  }

  console.log("4. Aplicando fix: NAV_LINKS no GlobalHeader");
  if (fs.existsSync(headerPath)) {
    let header = fs.readFileSync(headerPath, "utf8");
    if (header.includes("] as const;") && !header.includes("query?: string")) {
      header = header.replace("const NAV_LINKS = [", "const NAV_LINKS: { href: string; label: string; query?: string }[] = [");
      header = header.replace("] as const;", "];");
      fs.writeFileSync(headerPath, header);
    }
  } else {
    console.warn("Arquivo não encontrado:", headerPath);
  }

  console.log("5. Commit e push para new-trust");
  run("git add -A && git status", { cwd: WORK_DIR });
  run('git commit -m "fix: build Vercel (stub Supabase, tipos mini-sites e GlobalHeader)"', { cwd: WORK_DIR });
  run("git push origin main", { cwd: WORK_DIR });

  console.log("6. Limpando pasta temporária");
  fs.rmSync(WORK_DIR, { recursive: true });

  console.log("Concluído. new-trust no GitHub está com Lovable + fixes de build.");
}

main();
