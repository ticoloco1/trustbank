/**
 * Envio automático de USDC na retirada de créditos.
 * Requer PLATFORM_WALLET_PRIVATE_KEY no env (chave da carteira que detém USDC).
 * Usa Polygon por padrão (POLYGON_RPC_URL); opcionalmente ETH (ETH_RPC_URL).
 */
import { createWalletClient, http, parseUnits, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

const USDC_POLYGON = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as Address;
const USDC_DECIMALS = 6;

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export type SendUsdcResult =
  | { success: true; txHash: string; chain: "polygon" }
  | { success: false; error: string };

/**
 * Envia USDC da carteira da plataforma para o destinatário.
 * amountUsdc: string ex. "10.50"
 */
export async function sendUsdcTo(toAddress: string, amountUsdc: string): Promise<SendUsdcResult> {
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x")) {
    return { success: false, error: "PLATFORM_WALLET_PRIVATE_KEY not configured" };
  }
  const rpc = process.env.POLYGON_RPC_URL || process.env.CHAIN_RPC_URL;
  if (!rpc) {
    return { success: false, error: "POLYGON_RPC_URL or CHAIN_RPC_URL required for withdrawals" };
  }
  const amount = parseFloat(amountUsdc);
  if (Number.isNaN(amount) || amount < 0.01) {
    return { success: false, error: "Invalid amount" };
  }
  const to = toAddress as Address;
  if (!to.startsWith("0x")) {
    return { success: false, error: "Invalid recipient address" };
  }

  try {
    const account = privateKeyToAccount(pk as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: polygon,
      transport: http(rpc),
    });
    const amountWei = parseUnits(amountUsdc, USDC_DECIMALS);
    const hash = await client.writeContract({
      address: USDC_POLYGON,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, amountWei],
    });
    return { success: true, txHash: hash, chain: "polygon" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
