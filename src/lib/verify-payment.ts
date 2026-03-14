/**
 * Verificação de pagamento USDC na chain (ERC-20 Transfer).
 * Requer: CHAIN_RPC_URL, PLATFORM_WALLET, opcionalmente USDC_CONTRACT_ADDRESS.
 */
import { createPublicClient, http, decodeEventLog, type Address } from "viem";
import { mainnet, polygon } from "viem/chains";

const ERC20_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

const USDC_DECIMALS = 6;

export type VerifyPaymentResult =
  | { success: true; amount: string; from: Address }
  | { success: false; error: string };

export async function verifyUsdcPayment(params: {
  txHash: string;
  expectedTo?: string; // PLATFORM_WALLET
  minAmountUsdc?: number;
}): Promise<VerifyPaymentResult> {
  const rpcUrl = process.env.CHAIN_RPC_URL;
  const platformWallet = (process.env.PLATFORM_WALLET || "").toLowerCase() as Address;
  const usdcContract = process.env.USDC_CONTRACT_ADDRESS as Address | undefined;

  if (!rpcUrl) {
    return { success: false, error: "CHAIN_RPC_URL não configurado" };
  }
  const to = (params.expectedTo || platformWallet).toLowerCase();
  if (!to || !to.startsWith("0x")) {
    return { success: false, error: "PLATFORM_WALLET não configurado" };
  }

  try {
    const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : mainnet.id;
    const chain = chainId === 137 ? polygon : mainnet;
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const receipt = await client.getTransactionReceipt({
      hash: params.txHash as `0x${string}`,
    });
    if (!receipt || receipt.status !== "success") {
      return { success: false, error: "Transação não encontrada ou falhou" };
    }

    let foundAmount: bigint = BigInt(0);
    let foundFrom: Address | null = null;

    for (const log of receipt.logs) {
      if (usdcContract && log.address.toLowerCase() !== usdcContract.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({
          abi: ERC20_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "Transfer") {
          const args = decoded.args as { from: Address; to: Address; value: bigint };
          if (args.to.toLowerCase() === to) {
            foundAmount += args.value;
            if (!foundFrom) foundFrom = args.from;
          }
        }
      } catch {
        // ignore logs that aren't Transfer
      }
    }

    if (foundAmount === BigInt(0) || !foundFrom) {
      return { success: false, error: "Nenhuma transferência USDC para a carteira da plataforma nesta tx" };
    }

    const amountHuman = Number(foundAmount) / 10 ** USDC_DECIMALS;
    if (params.minAmountUsdc != null && amountHuman < params.minAmountUsdc) {
      return {
        success: false,
        error: `Valor recebido ${amountHuman.toFixed(2)} USDC é menor que o mínimo ${params.minAmountUsdc}`,
      };
    }

    return {
      success: true,
      amount: amountHuman.toFixed(USDC_DECIMALS),
      from: foundFrom,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao verificar transação";
    return { success: false, error: msg };
  }
}
