/**
 * Puxa o que for possível do projeto hashpo-com na Vercel para uma pasta local.
 * Uso: VERCEL_TOKEN=xxx node scripts/pull-hashpo-from-vercel.js
 *
 * 1. Crie um token em https://vercel.com/account/tokens
 * 2. Rode: VERCEL_TOKEN=seu_token node scripts/pull-hashpo-from-vercel.js
 *
 * O script lista os deployments do projeto, pega o mais recente, lista os arquivos
 * e baixa o conteúdo. Se o deploy foi feito por Git, a árvore de arquivos pode
 * não estar disponível (a Vercel nem sempre guarda o source nesse caso).
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT || "hashpo-com";
const TEAM_SLUG = process.env.VERCEL_TEAM || ""; // ID do time, se o projeto for de um time
const OUT_DIR = path.join(process.cwd(), "hashpo-vercel-export");

function request(method, urlPath, body = null) {
  const url = new URL(urlPath, "https://api.vercel.com");
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url.toString(), opts);
}

function getJson(res) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${res.url}`);
  return res.json();
}

async function listDeployments() {
  if (process.env.VERCEL_DEPLOYMENT_ID) {
    return process.env.VERCEL_DEPLOYMENT_ID;
  }
  const q = new URLSearchParams({ projectId: PROJECT });
  if (TEAM_SLUG) q.set("teamId", TEAM_SLUG);
  const res = await request("GET", `/v6/deployments?${q}`);
  const data = await getJson(res);
  const list = data.deployments || [];
  if (!list.length) {
    throw new Error("Nenhum deployment encontrado. Defina VERCEL_PROJECT (nome ou ID do projeto) e/ou VERCEL_TEAM. Ou defina VERCEL_DEPLOYMENT_ID com o ID do deployment.");
  }
  const prod = list.find((d) => d.target === "production") || list[0];
  return prod.uid || prod.id;
}

async function listFiles(deploymentId) {
  const q = TEAM_SLUG ? `?teamId=${TEAM_SLUG}` : "";
  const res = await request("GET", `/v6/deployments/${deploymentId}/files${q}`);
  if (res.status === 404) {
    const t = await res.text();
    throw new Error("Árvore de arquivos não disponível para este deployment (comum em deploys via Git). " + t);
  }
  return getJson(res);
}

function collectFiles(entries, base = "") {
  const files = [];
  for (const e of entries || []) {
    const name = e.name;
    const full = base ? `${base}/${name}` : name;
    if (e.type === "file" && e.uid) {
      files.push({ path: full, uid: e.uid });
    }
    if (e.type === "directory" && e.children) {
      files.push(...collectFiles(e.children, full));
    }
  }
  return files;
}

async function getFileContent(deploymentId, fileId) {
  const q = TEAM_SLUG ? `?teamId=${TEAM_SLUG}` : "";
  const res = await request("GET", `/v8/deployments/${deploymentId}/files/${fileId}${q}`);
  const data = await getJson(res);
  if (data.content != null) {
    return Buffer.from(data.content, "base64");
  }
  return null;
}

async function main() {
  if (!TOKEN) {
    console.error("Defina VERCEL_TOKEN. Ex: VERCEL_TOKEN=xxx node scripts/pull-hashpo-from-vercel.js");
    process.exit(1);
  }

  console.log("Projeto:", PROJECT);
  console.log("Buscando último deployment...");

  let deploymentId;
  try {
    deploymentId = await listDeployments();
  } catch (e) {
    console.error("Erro ao listar deployments:", e.message);
    process.exit(1);
  }

  console.log("Deployment ID:", deploymentId);
  console.log("Listando arquivos...");

  let entries;
  try {
    entries = await listFiles(deploymentId);
  } catch (e) {
    console.error(e.message);
    console.log("\nDica: use uma ferramenta como npx vercel-deploy-source-downloader para tentar outro método.");
    process.exit(1);
  }

  const files = collectFiles(Array.isArray(entries) ? entries : [entries]);
  console.log("Arquivos encontrados:", files.length);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let i = 0; i < files.length; i++) {
    const { path: filePath, uid } = files[i];
    const outPath = path.join(OUT_DIR, filePath);
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    try {
      const buf = await getFileContent(deploymentId, uid);
      if (buf) fs.writeFileSync(outPath, buf);
      if ((i + 1) % 10 === 0) console.log("Baixados", i + 1, "/", files.length);
    } catch (err) {
      console.warn("Falha ao baixar", filePath, err.message);
    }
  }

  console.log("Concluído. Arquivos em:", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
