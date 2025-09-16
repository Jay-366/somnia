import { ethers } from "ethers";

// RPC endpoint configurations with fallbacks
export const RPC_ENDPOINTS = {
  SEPOLIA: [
    "https://eth-sepolia.g.alchemy.com/v2/qH5VCBjfZi-FFoaJDk9va3l9HKwmZFLy",
    "https://rpc.sepolia.org",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://1rpc.io/sepolia"
  ],
  SOMNIA: [
    "https://dream-rpc.somnia.network/",
    "https://somnia.publicnode.com",
    "https://somnia-json-rpc.stakely.io"
  ]
} as const;

export async function createProviderWithFallback(chainId: number): Promise<ethers.Provider> {
  let endpoints: string[];
  
  if (chainId === 11155111) {
    endpoints = RPC_ENDPOINTS.SEPOLIA;
  } else if (chainId === 50312) {
    endpoints = RPC_ENDPOINTS.SOMNIA;
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const errors: Error[] = [];

  for (const rpcUrl of endpoints) {
    try {
      console.log(`Trying RPC endpoint: ${rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test the connection by getting block number
      await provider.getBlockNumber();
      console.log(`Successfully connected to: ${rpcUrl}`);
      
      return provider;
    } catch (error) {
      console.warn(`RPC endpoint ${rpcUrl} failed:`, error);
      errors.push(error as Error);
    }
  }

  throw new Error(`All RPC endpoints failed for chain ${chainId}. Errors: ${errors.map(e => e.message).join(', ')}`);
}

export async function getBalanceWithFallback(address: string, chainId: number): Promise<string> {
  const provider = await createProviderWithFallback(chainId);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export async function getTokenBalanceWithFallback(
  tokenAddress: string, 
  userAddress: string, 
  chainId: number
): Promise<string> {
  const provider = await createProviderWithFallback(chainId);
  
  const contract = new ethers.Contract(tokenAddress, [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ], provider);

  const [balance, decimals] = await Promise.all([
    contract.balanceOf(userAddress),
    contract.decimals()
  ]);

  return ethers.formatUnits(balance, decimals);
}