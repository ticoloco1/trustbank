/**
 * Créditos TrustBank: 1 crédito = 1 USDC.
 * Saldo na carteira; compra/venda de shares só com créditos; retirada = trocar créditos por USDC.
 */
import type { PrismaClient } from "@prisma/client";

type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function toFixed(num: number): string {
  return num.toFixed(2);
}

function parseBalance(s: string): number {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

/** Retorna saldo atual (string USDC). */
export async function getBalance(prisma: PrismaClient, wallet: string): Promise<string> {
  const w = wallet.toLowerCase().trim();
  const row = await prisma.creditBalance.findUnique({ where: { wallet: w } });
  return row?.balance_usdc ?? "0";
}

/** Debita dentro de uma transação existente (para usar junto com transferência de shares). */
export async function debitInTx(
  tx: PrismaTx,
  wallet: string,
  amountUsdc: string,
  type: "share_buy" | "withdrawal",
  referenceType?: string,
  referenceId?: string
): Promise<{ ok: true; balance_after: string } | { ok: false; error: string }> {
  const w = wallet.toLowerCase().trim();
  const amount = parseFloat(amountUsdc);
  if (amount <= 0) return { ok: false, error: "Invalid amount" };

  const row = await tx.creditBalance.upsert({
    where: { wallet: w },
    create: { wallet: w, balance_usdc: "0" },
    update: {},
  });
  const current = parseBalance(row.balance_usdc);
  if (current < amount) return { ok: false, error: "Insufficient credits" };
  const after = toFixed(current - amount);
  await tx.creditBalance.update({
    where: { wallet: w },
    data: { balance_usdc: after },
  });
  await tx.creditTransaction.create({
    data: {
      wallet: w,
      type,
      amount_usdc: `-${amountUsdc}`,
      balance_after: after,
      reference_type: referenceType ?? undefined,
      reference_id: referenceId ?? undefined,
    },
  });
  return { ok: true, balance_after: after };
}

/** Credita dentro de uma transação existente. */
export async function creditInTx(
  tx: PrismaTx,
  wallet: string,
  amountUsdc: string,
  type: "deposit" | "share_sell",
  referenceType?: string,
  referenceId?: string,
  txHash?: string
): Promise<void> {
  const w = wallet.toLowerCase().trim();
  const amount = parseFloat(amountUsdc);
  if (amount <= 0) throw new Error("Invalid amount");

  const row = await tx.creditBalance.upsert({
    where: { wallet: w },
    create: { wallet: w, balance_usdc: "0" },
    update: {},
  });
  const current = parseBalance(row.balance_usdc);
  const after = toFixed(current + amount);
  await tx.creditBalance.update({
    where: { wallet: w },
    data: { balance_usdc: after },
  });
  await tx.creditTransaction.create({
    data: {
      wallet: w,
      type,
      amount_usdc: amountUsdc,
      balance_after: after,
      reference_type: referenceType ?? undefined,
      reference_id: referenceId ?? undefined,
      tx_hash: txHash ?? undefined,
    },
  });
}

/** Debita valor do saldo. Retorna novo saldo ou erro. */
export async function debit(
  prisma: PrismaClient,
  wallet: string,
  amountUsdc: string,
  type: "share_buy" | "withdrawal",
  referenceType?: string,
  referenceId?: string
): Promise<{ ok: true; balance_after: string } | { ok: false; error: string }> {
  return prisma.$transaction((tx) => debitInTx(tx as PrismaTx, wallet, amountUsdc, type, referenceType, referenceId));
}

/** Credita valor no saldo. Retorna novo saldo. */
export async function credit(
  prisma: PrismaClient,
  wallet: string,
  amountUsdc: string,
  type: "deposit" | "share_sell",
  referenceType?: string,
  referenceId?: string,
  txHash?: string
): Promise<{ balance_after: string }> {
  return prisma.$transaction(async (tx) => {
    await creditInTx(tx as PrismaTx, wallet, amountUsdc, type, referenceType, referenceId, txHash);
    const row = await tx.creditBalance.findUnique({ where: { wallet: wallet.toLowerCase().trim() } });
    return { balance_after: row?.balance_usdc ?? amountUsdc };
  });
}
