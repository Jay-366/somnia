'use client';

import { useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { SwapHistoryService } from '@/lib/swap-history';
import { useActiveWalletChain } from 'thirdweb/react';

interface SwapHistoryTrackerProps {
  children: React.ReactNode;
}

/**
 * Component that automatically tracks swap history when transactions occur
 * Wrap your app with this to enable automatic history tracking
 */
export function SwapHistoryTracker({ children }: SwapHistoryTrackerProps) {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  useEffect(() => {
    if (!account?.address || !chain?.id) return;

    const historyService = new SwapHistoryService();

    // Listen for transaction events from window
    const handleSwapComplete = async (event: CustomEvent) => {
      const { txHash, fromToken, toToken, fromAmount, toAmount } = event.detail;
      
      console.log('🎯 SwapHistoryTracker received swap completion event:', {
        txHash: txHash.slice(0, 10) + '...',
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        userAddress: account.address,
        chainId: chain.id
      });
      
      try {
        await historyService.addSwapEntry(
          txHash,
          chain.id,
          account.address,
          fromToken,
          toToken,
          fromAmount,
          toAmount
        );
        
        console.log('✅ Swap successfully recorded in history:', {
          txHash: txHash.slice(0, 10) + '...',
          fromToken,
          toToken,
          fromAmount,
          toAmount
        });

        // Dispatch a custom event to notify dashboard to refresh
        window.dispatchEvent(new CustomEvent('swapHistoryUpdated', {
          detail: { userAddress: account.address }
        }));
        
      } catch (error) {
        console.error('❌ Failed to record swap in history:', error);
      }
    };

    // Add event listener for swap completion
    window.addEventListener('swapCompleted', handleSwapComplete as EventListener);

    return () => {
      window.removeEventListener('swapCompleted', handleSwapComplete as EventListener);
    };
  }, [account?.address, chain?.id]);

  return <>{children}</>;
}

/**
 * Helper function to dispatch swap completion events
 * Call this after successful swap transactions
 */
export function recordSwapCompletion(
  txHash: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  toAmount: string
) {
  console.log('📝 Recording swap completion:', {
    txHash: txHash.slice(0, 10) + '...' + txHash.slice(-8),
    fromToken,
    toToken,
    fromAmount,
    toAmount
  });

  const event = new CustomEvent('swapCompleted', {
    detail: {
      txHash,
      fromToken,
      toToken,
      fromAmount,
      toAmount
    }
  });
  
  window.dispatchEvent(event);
  console.log('✅ Swap completion event dispatched');
}