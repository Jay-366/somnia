'use client';

import React, { useState, useEffect } from 'react';
import { useActiveWallet, useWalletBalance } from 'thirdweb/react';
import { sepoliaChain, somniaChain } from '@/lib/networks';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletDebugInfo() {
  const wallet = useActiveWallet();
  const [chainInfo, setChainInfo] = useState<any>(null);
  
  // Get balance for current chain
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useWalletBalance({
    chain: chainInfo,
    address: wallet?.getAccount()?.address,
  });

  useEffect(() => {
    const updateChainInfo = async () => {
      if (wallet) {
        try {
          const chain = wallet.getChain();
          setChainInfo(chain);
        } catch (error) {
          console.error('Failed to get chain info:', error);
        }
      }
    };

    updateChainInfo();
  }, [wallet]);

  if (!wallet) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">🔌 Wallet Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300">No wallet connected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white">🔍 Wallet Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Address:</span>
            <div className="text-white font-mono text-xs">
              {wallet.getAccount()?.address || 'Unknown'}
            </div>
          </div>
          
          <div>
            <span className="text-gray-400">Chain ID:</span>
            <div className="text-white">
              {chainInfo?.id || 'Unknown'}
            </div>
          </div>
          
          <div>
            <span className="text-gray-400">Chain Name:</span>
            <div className="text-white">
              {chainInfo?.name || 'Unknown'}
            </div>
          </div>
          
          <div>
            <span className="text-gray-400">RPC:</span>
            <div className="text-white text-xs">
              {chainInfo?.rpc || 'Unknown'}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-600 pt-3">
          <div className="text-gray-400 text-sm mb-2">Balance Info:</div>
          
          {balanceLoading && (
            <div className="text-yellow-400">🔄 Loading balance...</div>
          )}
          
          {balanceError && (
            <div className="text-red-400 text-sm">
              ❌ Balance Error: {balanceError.message}
            </div>
          )}
          
          {balance && (
            <div className="space-y-1">
              <div className="text-green-400">
                ✅ Balance: {balance.displayValue} {balance.symbol}
              </div>
              <div className="text-xs text-gray-400">
                Raw: {balance.value.toString()}
              </div>
            </div>
          )}
          
          {!balanceLoading && !balanceError && !balance && (
            <div className="text-orange-400">⚠️ No balance data</div>
          )}
        </div>

        <div className="border-t border-slate-600 pt-3">
          <div className="text-gray-400 text-sm mb-2">Supported Chains:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-blue-400">
              🔹 Sepolia: {sepoliaChain.id}
            </div>
            <div className="text-orange-400">
              🌟 Somnia: {somniaChain.id}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}