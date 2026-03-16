/**
 * Verificação de pagamento USDC na chain (ERC-20 Transfer).
 * Aceita USDC na Ethereum ou na Polygon: tenta obter o receipt em cada rede até achar a tx.
 * Env: PLATFORM_WALLET (obrigatório); ETH_RPC_URL ou CHAIN_RPC_URL (Ethereum); POLYGON_RPC_URL (Polygon);
 * USDC_CONTRACT_ADDRESS ou USDC_ETH_CONTRACT; USDC_POLYGON_CONTRACT (opcionais).
 */
import { createPublicClient, http, decodeEventLog, parseAbiItem, type Address } from "viem";
import { mainnet, polygon } from "viem/chains";
import { getPlatformWallet } from "./payment-config";

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

// Default USDC contract addresses when not set via env
const USDC_ETH_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
const USDC_POLYGON_DEFAULT = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as Address; // native USDC on Polygon

export type VerifyPaymentResult =
  | { success: true; amount: string; from: Address; chain: "ethereum" | "polygon" }
  | { success: false; error: string };

type ChainConfig = {
  name: "ethereum" | "polygon";
  rpcUrl: string;
  chain: typeof mainnet | typeof polygon;
  usdcContract: Address | undefined;
};

function getChainConfigs(platformWallet: Address): ChainConfig[] {
  const configs: ChainConfig[] = [];
  const ethRpc = process.env.ETH_RPC_URL || process.env.CHAIN_RPC_URL;
  const polygonRpc = process.env.POLYGON_RPC_URL;
  const usdcEth = (process.env.USDC_ETH_CONTRACT || process.env.USDC_CONTRACT_ADDRESS || USDC_ETH_MAINNET) as Address;
  const usdcPolygon = (process.env.USDC_POLYGON_CONTRACT || USDC_POLYGON_DEFAULT) as Address;

  if (ethRpc) {
    configs.push({
      name: "ethereum",
      rpcUrl: ethRpc,
      chain: mainnet,
      usdcContract: usdcEth,
    });
  }
  if (polygonRpc) {
    configs.push({
      name: "polygon",
      rpcUrl: polygonRpc,
      chain: polygon,
      usdcContract: usdcPolygon,
    });
  }
  return configs;
}

function verifyReceipt(params: {
  receipt: { logs: { address: string; data: `0x${string}`; topics: `0x${string}`[] }[] };
  usdcContract: Address | undefined;
  to: string;
  minAmountUsdc?: number;
}): VerifyPaymentResult | null {
  const { receipt, usdcContract, to, minAmountUsdc } = params;
  let foundAmount: bigint = BigInt(0);
  let foundFrom: Address | null = null;

  for (const log of receipt.logs) {
    if (usdcContract && log.address.toLowerCase() !== usdcContract.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: ERC20_ABI,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
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
    return null;
  }

  const amountHuman = Number(foundAmount) / 10 ** USDC_DECIMALS;
  if (minAmountUsdc != null && amountHuman < minAmountUsdc) {
    return {
      success: false,
      error: `Amount received ${amountHuman.toFixed(2)} USDC is below minimum ${minAmountUsdc}`,
    };
  }

  return {
    success: true,
    amount: amountHuman.toFixed(USDC_DECIMALS),
    from: foundFrom,
    chain: "ethereum", // will be overwritten by caller
  };
}

export async function verifyUsdcPayment(params: {
  txHash: string;
  expectedTo?: string;
  minAmountUsdc?: number;
}): Promise<VerifyPaymentResult> {
  const platformWallet = getPlatformWallet() as Address;
  const to = (params.expectedTo || platformWallet).toLowerCase();
  if (!to || !to.startsWith("0x")) {
    return { success: false, error: "PLATFORM_WALLET not configured" };
  }

  const configs = getChainConfigs(platformWallet as Address);
  if (configs.length === 0) {
    return { success: false, error: "Configure at least one of ETH_RPC_URL, CHAIN_RPC_URL or POLYGON_RPC_URL" };
  }

  const txHash = params.txHash as `0x${string}`;

  for (const cfg of configs) {
    try {
      const client = createPublicClient({
        chain: cfg.chain,
        transport: http(cfg.rpcUrl),
      });
      const receipt = await client.getTransactionReceipt({ hash: txHash });
      if (!receipt) continue;
      if (receipt.status !== "success") {
        return { success: false, error: "Transaction failed on chain" };
      }
      const result = verifyReceipt({
        receipt,
        usdcContract: cfg.usdcContract,
        to,
        minAmountUsdc: params.minAmountUsdc,
      });
      if (result === null) continue; // no USDC transfer to platform on this chain, try next
      if (!result.success) return result;
      return { ...result, chain: cfg.name };
    } catch {
      // tx not on this chain or RPC error, try next
      continue;
    }
  }

  return {
    success: false,
    error: "Transaction not found or no USDC transfer to platform wallet on Ethereum or Polygon",
  };
}

/** Blocos atrás para varrer depósitos (~7 dias Ethereum ~50k, Polygon ~400k) */
const BLOCKS_LOOKBACK_ETH = 50_000;
const BLOCKS_LOOKBACK_POLYGON = 400_000;

export type DepositFound = { txHash: string; amount: string; chain: "ethereum" | "polygon" };

/**
 * Descobre transferências USDC para a carteira da plataforma a partir de um wallet (depósitos).
 * Varre os blocos recentes em cada rede configurada.
 */
export async function findDepositsToPlatform(fromWallet: string): Promise<DepositFound[]> {
  const platformWallet = getPlatformWallet() as Address;
  if (!platformWallet?.startsWith("0x")) return [];

  const configs = getChainConfigs(platformWallet);
  const results: DepositFound[] = [];
  const from = fromWallet.toLowerCase() as Address;
  const to = platformWallet;

  for (const cfg of configs) {
    if (!cfg.usdcContract) continue;
    try {
      const client = createPublicClient({
        chain: cfg.chain,
        transport: http(cfg.rpcUrl),
      });
      const block = await client.getBlockNumber();
      const fromBlock = block - BigInt(cfg.name === "polygon" ? BLOCKS_LOOKBACK_POLYGON : BLOCKS_LOOKBACK_ETH);
      const logs = await client.getLogs({
        address: cfg.usdcContract,
        event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
        args: { from, to },
        fromBlock: fromBlock < BigInt(0) ? BigInt(0) : fromBlock,
        toBlock: "latest",
      });
      for (const log of logs) {
        const value = (log.args as { value?: bigint }).value ?? BigInt(0);
        const amountHuman = Number(value) / 10 ** USDC_DECIMALS;
        if (amountHuman >= 0.01) {
          results.push({
            txHash: log.transactionHash,
            amount: amountHuman.toFixed(USDC_DECIMALS),
            chain: cfg.name,
          });
        }
      }
    } catch {
      // skip chain on error
    }
  }
  return results;
}
