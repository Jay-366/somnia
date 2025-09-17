import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { ExecutorVaultABI } from './executor-vault-abi';
import { CONTRACT_ADDRESSES } from './contracts';

// ExecutorVault contract configuration
export const EXECUTOR_VAULT_CONFIG = {
  // Use the deployed ExecutorVault address from Sepolia
  address: CONTRACT_ADDRESSES.EXECUTOR_VAULT,
  abi: ExecutorVaultABI,
};

// Custom hook to get ethers contract instance for ExecutorVault
export function useExecutorVaultContract() {
  const account = useActiveAccount();

  const getContract = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    if (typeof window !== 'undefined' && window.ethereum) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error('Wallet address mismatch. Please ensure the same wallet is connected.');
      }
      
      const contract = new ethers.Contract(
        EXECUTOR_VAULT_CONFIG.address,
        EXECUTOR_VAULT_CONFIG.abi,
        signer
      );

      return { contract, signer, provider: ethersProvider };
    } else {
      throw new Error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
    }
  };

  const getReadOnlyContract = async () => {
    const ethersProvider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.sepolia.org'
    );
    
    const contract = new ethers.Contract(
      EXECUTOR_VAULT_CONFIG.address,
      EXECUTOR_VAULT_CONFIG.abi,
      ethersProvider
    );

    return { contract, provider: ethersProvider };
  };

  return { getContract, getReadOnlyContract };
}

// ExecutorVault service class for contract interactions
export class ExecutorVaultService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contract: ethers.Contract, signer: ethers.Signer) {
    this.contract = contract;
    this.signer = signer;
  }

  // ========= SWAP FUNCTIONS =========

  /**
   * Execute AOT → WETH swap
   * @param aotAmountIn Amount of AOT to swap (in ether units)
   * @returns Transaction response
   */
  async executeSwap(aotAmountIn: string): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.executeSwap(ethers.parseEther(aotAmountIn));
    return tx;
  }

  // ========= DEPOSIT FUNCTIONS =========

  /**
   * Deposit tokens to vault
   * @param tokenAddress Token address (WETH or AOT)
   * @param amount Amount to deposit (in ether units)
   * @returns Transaction response
   */
  async deposit(tokenAddress: string, amount: string): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.deposit(tokenAddress, ethers.parseEther(amount));
    return tx;
  }

  /**
   * Deposit AOT tokens
   * @param amount Amount of AOT to deposit
   * @returns Transaction response
   */
  async depositAOT(amount: string): Promise<ethers.TransactionResponse> {
    return this.deposit(CONTRACT_ADDRESSES.AOT_TOKEN, amount);
  }

  /**
   * Deposit WETH tokens
   * @param amount Amount of WETH to deposit
   * @returns Transaction response
   */
  async depositWETH(amount: string): Promise<ethers.TransactionResponse> {
    return this.deposit(CONTRACT_ADDRESSES.WETH, amount);
  }

  // ========= WITHDRAWAL FUNCTIONS =========

  /**
   * Withdraw tokens from vault
   * @param tokenAddress Token address
   * @param amount Amount to withdraw (in ether units)
   * @param unwrap Whether to unwrap WETH to ETH
   * @returns Transaction response
   */
  async withdraw(tokenAddress: string, amount: string, unwrap: boolean = false): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.withdraw(tokenAddress, ethers.parseEther(amount), unwrap);
    return tx;
  }

  /**
   * Withdraw WETH as WETH tokens
   * @param amount Amount to withdraw
   * @returns Transaction response
   */
  async withdrawWETH(amount: string): Promise<ethers.TransactionResponse> {
    return this.withdraw(CONTRACT_ADDRESSES.WETH, amount, false);
  }

  /**
   * Withdraw WETH as ETH (unwrapped)
   * @param amount Amount to withdraw
   * @returns Transaction response
   */
  async withdrawETH(amount: string): Promise<ethers.TransactionResponse> {
    return this.withdraw(CONTRACT_ADDRESSES.WETH, amount, true);
  }

  /**
   * Withdraw AOT tokens
   * @param amount Amount to withdraw
   * @returns Transaction response
   */
  async withdrawAOT(amount: string): Promise<ethers.TransactionResponse> {
    return this.withdraw(CONTRACT_ADDRESSES.AOT_TOKEN, amount, false);
  }

  // ========= VIEW FUNCTIONS =========

  /**
   * Get user balance for specific token
   * @param userAddress User address
   * @param tokenAddress Token address
   * @returns Balance in ether format
   */
  async getUserBalance(userAddress: string, tokenAddress: string): Promise<string> {
    const balance = await this.contract.getUserBalance(userAddress, tokenAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Get user balances for both WETH and AOT
   * @param userAddress User address
   * @returns Object with WETH and AOT balances
   */
  async getUserBalances(userAddress: string): Promise<{wethBalance: string, aotBalance: string}> {
    const [wethBalance, aotBalance] = await this.contract.getUserBalances(userAddress);
    return {
      wethBalance: ethers.formatEther(wethBalance),
      aotBalance: ethers.formatEther(aotBalance)
    };
  }

  /**
   * Get total vault balances
   * @returns Object with total WETH and AOT in vault
   */
  async getTotalBalances(): Promise<{wethTotal: string, aotTotal: string}> {
    const [wethTotal, aotTotal] = await this.contract.getTotalBalances();
    return {
      wethTotal: ethers.formatEther(wethTotal),
      aotTotal: ethers.formatEther(aotTotal)
    };
  }

  /**
   * Get actual contract balances (for verification)
   * @returns Object with actual contract token balances
   */
  async getContractBalances(): Promise<{wethActual: string, aotActual: string}> {
    const [wethActual, aotActual] = await this.contract.getContractBalances();
    return {
      wethActual: ethers.formatEther(wethActual),
      aotActual: ethers.formatEther(aotActual)
    };
  }

  /**
   * Get pool information
   * @returns Pool configuration details
   */
  async getPoolInfo(): Promise<{
    currency0: string,
    currency1: string,
    fee: number,
    tickSpacing: number
  }> {
    const [currency0, currency1, fee, tickSpacing] = await this.contract.getPoolInfo();
    return {
      currency0,
      currency1,
      fee: Number(fee),
      tickSpacing: Number(tickSpacing)
    };
  }

  /**
   * Get vault contract constants
   * @returns Vault configuration
   */
  async getVaultInfo(): Promise<{
    wethAddress: string,
    aotAddress: string,
    poolManager: string,
    poolFee: number,
    tickSpacing: number,
    owner: string
  }> {
    const [wethAddress, aotAddress, poolManager, poolFee, tickSpacing, owner] = await Promise.all([
      this.contract.WETH(),
      this.contract.AOT(),
      this.contract.POOL_MANAGER(),
      this.contract.POOL_FEE(),
      this.contract.TICK_SPACING(),
      this.contract.owner()
    ]);

    return {
      wethAddress,
      aotAddress,
      poolManager,
      poolFee: Number(poolFee),
      tickSpacing: Number(tickSpacing),
      owner
    };
  }

  // ========= EVENT LISTENERS =========

  /**
   * Set up event listeners for vault events
   */
  setupEventListeners() {
    // Listen to SwapExecuted events
    this.contract.on('SwapExecuted', (user, aotAmountIn, wethAmountOut, timestamp, event) => {
      console.log('Swap executed:', {
        user,
        aotAmountIn: ethers.formatEther(aotAmountIn),
        wethAmountOut: ethers.formatEther(wethAmountOut),
        timestamp: Number(timestamp),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });

    // Listen to Deposit events
    this.contract.on('Deposit', (user, token, amount, event) => {
      console.log('Deposit event:', {
        user,
        token,
        amount: ethers.formatEther(amount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });

    // Listen to Withdrawal events
    this.contract.on('Withdrawal', (user, token, amount, unwrapped, event) => {
      console.log('Withdrawal event:', {
        user,
        token,
        amount: ethers.formatEther(amount),
        unwrapped,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    this.contract.removeAllListeners();
  }
}

// Utility functions for easy access
export async function getExecutorVaultUserBalances(userAddress: string, rpcUrl?: string): Promise<{wethBalance: string, aotBalance: string}> {
  const ethersProvider = new ethers.JsonRpcProvider(
    rpcUrl || process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.sepolia.org'
  );
  
  const contract = new ethers.Contract(
    EXECUTOR_VAULT_CONFIG.address,
    EXECUTOR_VAULT_CONFIG.abi,
    ethersProvider
  );

  const [wethBalance, aotBalance] = await contract.getUserBalances(userAddress);
  return {
    wethBalance: ethers.formatEther(wethBalance),
    aotBalance: ethers.formatEther(aotBalance)
  };
}

export async function getExecutorVaultInfo(rpcUrl?: string) {
  const ethersProvider = new ethers.JsonRpcProvider(
    rpcUrl || process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.sepolia.org'
  );
  
  const contract = new ethers.Contract(
    EXECUTOR_VAULT_CONFIG.address,
    EXECUTOR_VAULT_CONFIG.abi,
    ethersProvider
  );

  const [poolInfo, totalBalances] = await Promise.all([
    contract.getPoolInfo(),
    contract.getTotalBalances()
  ]);

  return {
    poolInfo: {
      currency0: poolInfo[0],
      currency1: poolInfo[1], 
      fee: Number(poolInfo[2]),
      tickSpacing: Number(poolInfo[3])
    },
    totalBalances: {
      wethTotal: ethers.formatEther(totalBalances[0]),
      aotTotal: ethers.formatEther(totalBalances[1])
    }
  };
}