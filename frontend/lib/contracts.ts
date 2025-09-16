import { ethers } from "ethers";

// Contract addresses on Sepolia testnet
export const CONTRACT_ADDRESSES = {
  POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
  POSITION_MANAGER: "0x5de19fE5E05fD56882ACd533cE303def8c5C5705",
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  AOT_TOKEN: "0xD98f9971773045735C62cD8f1a70047f81b9a468",
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  PYTH_ORACLE: "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21",
  // ExecutorVault - deployed on Sepolia
  EXECUTOR_VAULT: process.env.NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS || "0x06039B0f7Adce994ab0123c035F3C55e5db6944e",
} as const;

// Helper function to get contract address for specific network
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES, chainId: number): string | null {
  // All these contracts are on Sepolia (11155111)
  if (chainId === 11155111) {
    return CONTRACT_ADDRESSES[contractName];
  }
  
  // Somnia (50312) only has ESCROW_NATIVE
  if (chainId === 50312) {
    if (contractName === 'EXECUTOR_VAULT') {
      // Return escrow address for Somnia if needed
      return process.env.NEXT_PUBLIC_ESCROW_ADDRESS || null;
    }
    return null; // Other contracts don't exist on Somnia
  }
  
  return null; // Unsupported network
}

// Helper to check if a contract exists on a network
export function isContractAvailable(contractName: keyof typeof CONTRACT_ADDRESSES, chainId: number): boolean {
  return getContractAddress(contractName, chainId) !== null;
}

// Network configuration
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org",
  blockExplorer: "https://sepolia.etherscan.io",
} as const;

// ERC20 ABI (minimal interface)
export const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function transferFrom(address from, address to, uint256 value) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

// WETH ABI (extends ERC20)
export const WETH_ABI = [
  ...ERC20_ABI,
  "function deposit() external payable",
  "function withdraw(uint256 wad) external",
  "event Deposit(address indexed dst, uint256 wad)",
  "event Withdrawal(address indexed src, uint256 wad)",
] as const;

export class ContractClient {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(rpcUrl?: string, signer?: ethers.Signer) {
    this.provider = new ethers.JsonRpcProvider(
      rpcUrl || SEPOLIA_CONFIG.rpcUrl
    );
    this.signer = signer;
  }

  // Get ERC20 token contract
  getERC20Contract(address: string, withSigner: boolean = false) {
    return new ethers.Contract(
      address,
      ERC20_ABI,
      withSigner && this.signer ? this.signer : this.provider
    );
  }

  // Get WETH contract
  getWETHContract(withSigner: boolean = false) {
    return new ethers.Contract(
      CONTRACT_ADDRESSES.WETH,
      WETH_ABI,
      withSigner && this.signer ? this.signer : this.provider
    );
  }

  // Get AOT token contract
  getAOTContract(withSigner: boolean = false) {
    return this.getERC20Contract(CONTRACT_ADDRESSES.AOT_TOKEN, withSigner);
  }

  // Helper function to get token balance
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const contract = this.getERC20Contract(tokenAddress);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals()
      ]);
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      console.error(`Failed to get token balance for ${tokenAddress}:`, error);
      if (error.message?.includes('network')) {
        throw new Error('Network connection failed. Please check your RPC connection.');
      } else if (error.message?.includes('contract')) {
        throw new Error('Token contract not found on this network.');
      } else {
        throw new Error(`Failed to fetch balance: ${error.message}`);
      }
    }
  }

  // Helper function to get token info
  async getTokenInfo(tokenAddress: string) {
    const contract = this.getERC20Contract(tokenAddress);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      address: tokenAddress,
    };
  }

  // Helper function to approve token spending
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer required for token approval");
    }

    const contract = this.getERC20Contract(tokenAddress, true);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    return await contract.approve(spenderAddress, amountWei);
  }

  // Helper function to wrap ETH to WETH
  async wrapETH(amount: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer required for wrapping ETH");
    }

    const wethContract = this.getWETHContract(true);
    const amountWei = ethers.parseEther(amount);
    
    return await wethContract.deposit({ value: amountWei });
  }

  // Helper function to unwrap WETH to ETH
  async unwrapWETH(amount: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer required for unwrapping WETH");
    }

    const wethContract = this.getWETHContract(true);
    const amountWei = ethers.parseEther(amount);
    
    return await wethContract.withdraw(amountWei);
  }

  // Set signer for transactions
  setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }
}

// Export convenience functions
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string,
  rpcUrl?: string
): Promise<string> {
  const client = new ContractClient(rpcUrl);
  return client.getTokenBalance(tokenAddress, userAddress);
}

export async function getTokenInfo(tokenAddress: string, rpcUrl?: string) {
  const client = new ContractClient(rpcUrl);
  return client.getTokenInfo(tokenAddress);
}