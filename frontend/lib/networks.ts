import { defineChain } from "thirdweb";

// Network configurations
export const SUPPORTED_NETWORKS = {
  SEPOLIA: {
    id: 11155111,
    name: "Sepolia",
    displayName: "Sepolia Testnet",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/qH5VCBjfZi-FFoaJDk9va3l9HKwmZFLy",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    icon: "🔹",
    color: "#627EEA",
    description: "ExecutorVault & Swaps",
    contracts: {
      EXECUTOR_VAULT: "0x06039B0f7Adce994ab0123c035F3C55e5db6944e",
      WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
      AOT_TOKEN: "0xD98f9971773045735C62cD8f1a70047f81b9a468",
      POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
      POSITION_MANAGER: "0x5de19fE5E05fD56882ACd533cE303def8c5C5705",
    }
  },
  SOMNIA: {
    id: 50312,
    name: "Somnia",
    displayName: "Somnia Testnet",
    rpcUrl: "https://dream-rpc.somnia.network/",
    blockExplorer: "https://shannon-explorer.somnia.network/",
    nativeCurrency: {
      name: "STT",
      symbol: "STT",
      decimals: 18,
    },
    icon: "🌟",
    color: "#FF6B35",
    description: "Escrow & Native STT",
    contracts: {
      ESCROW_NATIVE: process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000",
    }
  }
} as const;

// Thirdweb chain definitions with multiple RPC endpoints for reliability
export const sepoliaChain = defineChain({
  id: 11155111,
  name: "Sepolia",
  rpc: "https://eth-sepolia.g.alchemy.com/v2/qH5VCBjfZi-FFoaJDk9va3l9HKwmZFLy",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    }
  ],
  testnet: true
});

export const somniaChain = defineChain({
  id: 50312,
  name: "Somnia",
  rpc: "https://dream-rpc.somnia.network/",
  nativeCurrency: {
    name: "STT",
    symbol: "STT",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Shannon Explorer",
      url: "https://shannon-explorer.somnia.network/",
    },
    {
      name: "Social Scan",
      url: "https://somnia-testnet.socialscan.io/",
    }
  ],
  testnet: true
});

// Available chains array for thirdweb
export const supportedChains = [sepoliaChain, somniaChain];

// Network utilities
export function getNetworkById(chainId: number) {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.id === chainId);
}

export function getNetworkByName(name: string) {
  return Object.values(SUPPORTED_NETWORKS).find(
    network => network.name.toLowerCase() === name.toLowerCase()
  );
}

export function isNetworkSupported(chainId: number): boolean {
  return Object.values(SUPPORTED_NETWORKS).some(network => network.id === chainId);
}

// Default network (Sepolia for ExecutorVault)
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.SEPOLIA;