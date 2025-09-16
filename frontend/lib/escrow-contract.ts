import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { EscrowNativeABI } from './escrow-abi';

// Contract configuration
export const ESCROW_CONTRACT_CONFIG = {
  // Replace with your deployed contract address
  address: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  abi: EscrowNativeABI,
};

// Custom hook to get ethers contract instance using browser's injected provider
export function useEscrowContract() {
  const account = useActiveAccount();

  const getContract = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    // Check if MetaMask or other injected provider is available
    if (typeof window !== 'undefined' && window.ethereum) {
      // Create ethers provider from browser's injected provider (MetaMask, etc.)
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Get signer
      const signer = await ethersProvider.getSigner();
      
      // Verify the signer address matches the connected account
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error('Wallet address mismatch. Please ensure the same wallet is connected.');
      }
      
      // Create contract instance
      const contract = new ethers.Contract(
        ESCROW_CONTRACT_CONFIG.address,
        ESCROW_CONTRACT_CONFIG.abi,
        signer
      );

      return { contract, signer, provider: ethersProvider };
    } else {
      throw new Error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
    }
  };

  const getReadOnlyContract = async () => {
    // Always use RPC provider for read-only operations for consistency
    const ethersProvider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_SOMNIA_RPC || 'https://dream-rpc.somnia.network/'
    );
    
    // Create read-only contract instance
    const contract = new ethers.Contract(
      ESCROW_CONTRACT_CONFIG.address,
      ESCROW_CONTRACT_CONFIG.abi,
      ethersProvider
    );

    return { contract, provider: ethersProvider };
  };

  return { getContract, getReadOnlyContract };
}

// Contract interaction functions
export class EscrowContractService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contract: ethers.Contract, signer: ethers.Signer) {
    this.contract = contract;
    this.signer = signer;
  }

  // Deposit ETH/STT into escrow
  async deposit(amount: string): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.deposit({
      value: ethers.parseEther(amount)
    });
    return tx;
  }

  // Withdraw pending returns
  async withdraw(): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.withdraw();
    return tx;
  }

  // Get escrow balance for user
  async getEscrowBalance(userAddress: string): Promise<string> {
    const balance = await this.contract.escrowOf(userAddress);
    return ethers.formatEther(balance);
  }

  // Get pending returns for user
  async getPendingReturns(userAddress: string): Promise<string> {
    const pending = await this.contract.pendingReturnOf(userAddress);
    return ethers.formatEther(pending);
  }

  // Get total balance for user
  async getTotalBalance(userAddress: string): Promise<string> {
    const total = await this.contract.totalBalanceOf(userAddress);
    return ethers.formatEther(total);
  }

  // Get contract's total balance
  async getContractBalance(): Promise<string> {
    const balance = await this.contract.contractBalance();
    return ethers.formatEther(balance);
  }

  // Admin function: Mark swap as executed
  async markExecuted(
    userAddress: string, 
    returnedAmount: string, 
    txReference: string
  ): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.markExecuted(
      userAddress,
      ethers.parseEther(returnedAmount),
      ethers.id(txReference) // Convert string to bytes32
    );
    return tx;
  }

  // Admin function: Refund user
  async refund(userAddress: string): Promise<ethers.TransactionResponse> {
    const tx = await this.contract.refund(userAddress);
    return tx;
  }

  // Listen to events
  setupEventListeners() {
    // Listen to Deposited events
    this.contract.on('Deposited', (user, amount, event) => {
      console.log('Deposit event:', {
        user,
        amount: ethers.formatEther(amount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });

    // Listen to Withdrawn events
    this.contract.on('Withdrawn', (user, amount, event) => {
      console.log('Withdrawal event:', {
        user,
        amount: ethers.formatEther(amount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });

    // Listen to Executed events
    this.contract.on('Executed', (user, returnedAmount, txReference, event) => {
      console.log('Execution event:', {
        user,
        returnedAmount: ethers.formatEther(returnedAmount),
        txReference,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
  }

  // Remove event listeners
  removeEventListeners() {
    this.contract.removeAllListeners();
  }
}