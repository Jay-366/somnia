import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from './contracts';
import { SUPPORTED_NETWORKS } from './networks';

export interface SwapHistoryEntry {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'success' | 'failed' | 'pending';
  gasUsed?: number;
  gasPrice?: string;
  user: string;
  contract: string;
}

export class SwapHistoryService {
  private readonly STORAGE_KEY = 'afs_swap_history';
  
  // Event signatures for different swap events
  private readonly EVENT_SIGNATURES = {
    // ExecutorVault swap events
    SWAP_EXECUTED: 'SwapExecuted(address,uint256,uint256)',
    // EscrowNative events
    EXECUTED: 'Executed(address,uint256,bytes32)',
    // Standard ERC20 Transfer events that might indicate swaps
    TRANSFER: 'Transfer(address,address,uint256)',
  };

  /**
   * Get swap history for a specific user - Local JSON only (no blockchain scanning)
   */
  async getUserSwapHistory(userAddress: string): Promise<SwapHistoryEntry[]> {
    try {
      // Only get cached history from localStorage (no expensive blockchain calls)
      const cachedHistory = this.getCachedHistory(userAddress);
      
      console.log('📊 Loaded', cachedHistory.length, 'swaps from local storage for', userAddress.slice(0, 6) + '...');
      
      // Sort by timestamp (newest first)
      return cachedHistory.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching swap history:', error);
      return [];
    }
  }

  /**
   * Add a new swap entry - Simple local storage only (no blockchain calls)
   */
  async addSwapEntry(
    txHash: string,
    chainId: number,
    userAddress: string,
    fromToken: string,
    toToken: string,
    fromAmount: string,
    toAmount: string
  ): Promise<void> {
    try {
      // Create entry with current timestamp and assumed success
      const entry: SwapHistoryEntry = {
        txHash,
        blockNumber: 0, // Not fetched to avoid costs
        timestamp: Date.now(), // Current time
        chainId,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        status: 'success', // Assume success since we're recording after completion
        gasUsed: 0, // Not fetched to avoid costs
        user: userAddress.toLowerCase(),
        contract: chainId === 11155111 ? CONTRACT_ADDRESSES.EXECUTOR_VAULT : '', // Known contract
      };

      // Add to cached history
      const cachedHistory = this.getCachedHistory(userAddress);
      const updatedHistory = [entry, ...cachedHistory.filter(h => h.txHash !== txHash)];
      this.cacheHistory(userAddress, updatedHistory);

      console.log('✅ Swap recorded locally:', {
        txHash: txHash.slice(0, 10) + '...' + txHash.slice(-8),
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        chainId,
        timestamp: new Date(entry.timestamp).toLocaleTimeString()
      });
    } catch (error) {
      console.error('❌ Error recording swap locally:', error);
    }
  }

  // Removed all blockchain scanning methods to avoid API costs
  // Now using simple localStorage-only approach

  /**
   * Get cached history from localStorage
   */
  private getCachedHistory(userAddress: string): SwapHistoryEntry[] {
    try {
      const cached = localStorage.getItem(`${this.STORAGE_KEY}_${userAddress.toLowerCase()}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  /**
   * Cache history to localStorage
   */
  private cacheHistory(userAddress: string, history: SwapHistoryEntry[]): void {
    try {
      // Keep only last 100 entries to avoid localStorage bloat
      const limitedHistory = history.slice(0, 100);
      localStorage.setItem(
        `${this.STORAGE_KEY}_${userAddress.toLowerCase()}`,
        JSON.stringify(limitedHistory)
      );
    } catch (error) {
      console.error('Error caching history:', error);
    }
  }

  // Removed mergeHistories method - no longer needed with localStorage-only approach

  /**
   * Clear cached history for user
   */
  clearHistory(userAddress: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_${userAddress.toLowerCase()}`);
      console.log('🗑️ Cleared swap history for', userAddress.slice(0, 6) + '...');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /**
   * Get total swap count for user (for debugging)
   */
  getSwapCount(userAddress: string): number {
    const history = this.getCachedHistory(userAddress);
    return history.length;
  }

  /**
   * Export swap history as JSON (for backup)
   */
  exportHistory(userAddress: string): string {
    const history = this.getCachedHistory(userAddress);
    return JSON.stringify(history, null, 2);
  }
}