/**
 * Seed TrustBank: cria platform_settings e um admin.
 * Rode: ADMIN_WALLET=0xSuaWallet npx prisma db seed
 * Ou: node prisma/seed.js (com DATABASE_URL no .env.local ou use dotenv)
 */
try { require("dotenv").config({ path: ".env.local" }); } catch (_) {}
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ADMIN_WALLET = process.env.ADMIN_WALLET || "0xf841d9F5ba7eac3802e9A476a85775e23d084BBe";

async function main() {
  await prisma.platformSetting.upsert({
    where: { id: 1 },
    create: { id: 1, platform_name: "TrustBank", grid_columns: 4 },
    update: {},
  });
  await prisma.adminWalletAddress.upsert({
    where: { wallet_address: ADMIN_WALLET.toLowerCase() },
    create: { wallet_address: ADMIN_WALLET.toLowerCase(), note: "admin principal" },
    update: {},
  });
  console.log("Seed OK. Admin wallet:", ADMIN_WALLET);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
