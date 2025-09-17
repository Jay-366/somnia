'use client';

import React, { useState, useEffect } from 'react';
import { useActiveWallet, useActiveAccount } from 'thirdweb/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Nav from '@/components/Nav';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { ExecutorVaultPanel } from '@/components/ExecutorVaultPanel';
import { ExecutorVaultTransactionHistory } from '@/components/ExecutorVaultTransactionHistory';
import { PoolDebugPanel } from '@/components/PoolDebugPanel';
import { getNetworkById, SUPPORTED_NETWORKS } from '@/lib/networks';
import toast from 'react-hot-toast';

export default function TestExecutorVaultPage() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isSepoliaNetwork, setIsSepoliaNetwork] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    const updateNetworkInfo = async () => {
      console.log('Wallet status:', { wallet: !!wallet, account: !!account });
      
      if (wallet) {
        try {
          const chain = wallet.getChain();
          const chainId = chain?.id;
          const network = getNetworkById(chainId!);
          setNetworkInfo(network);
          setIsSepoliaNetwork(chainId === 11155111);
          console.log('Network updated:', { chainId, network: network?.name });
        } catch (error) {
          console.error('Failed to get network info:', error);
        }
      }
      setWalletLoading(false);
    };

    // Add a small delay to ensure wallet is properly initialized
    const timer = setTimeout(updateNetworkInfo, 500);
    return () => clearTimeout(timer);
  }, [wallet, account]);

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <Nav />
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-white mb-6">ExecutorVault Test Interface</h1>
              <div className="text-yellow-400 text-lg">🔄 Loading wallet connection...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <Nav />
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-white mb-6">ExecutorVault Test Interface</h1>
              <p className="text-gray-300 text-lg mb-8">
                Connect your wallet to interact with the ExecutorVault smart contract
              </p>
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-slate-400 text-sm mb-4">
                  This interface allows you to test all ExecutorVault functions including deposits, swaps, and withdrawals.
                </p>
                <p className="text-yellow-400 text-sm">
                  👆 Please connect your wallet using the button in the navigation bar above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Nav />
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏛️ ExecutorVault Test Interface
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Interactive testing environment for ExecutorVault smart contract
          </p>
          
          {/* Network Status */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <NetworkSwitcher />
            {networkInfo && (
              <Badge 
                variant={isSepoliaNetwork ? "default" : "destructive"}
                className="px-4 py-2"
              >
                {isSepoliaNetwork ? "✅ Sepolia (ExecutorVault Available)" : "❌ Switch to Sepolia Required"}
              </Badge>
            )}
          </div>
        </div>

        {/* Network Warning */}
        {!isSepoliaNetwork && (
          <Card className="bg-yellow-900/20 border-yellow-600/50">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                ⚠️ Network Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-300">
                ExecutorVault is deployed on Sepolia testnet. Please switch to Sepolia network to interact with the contract.
              </p>
              <div className="mt-4">
                <p className="text-sm text-yellow-400">
                  <strong>ExecutorVault Address:</strong> {SUPPORTED_NETWORKS.SEPOLIA.contracts.EXECUTOR_VAULT}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main ExecutorVault Interface */}
        {isSepoliaNetwork && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ExecutorVaultPanel />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <ExecutorVaultTransactionHistory />
                <PoolDebugPanel />
              </div>
            </div>
          </div>
        )}

        {/* Contract Information */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">📋 Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3">Contract Addresses</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ExecutorVault:</span>
                    <span className="text-white font-mono text-xs">
                      {SUPPORTED_NETWORKS.SEPOLIA.contracts.EXECUTOR_VAULT}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WETH:</span>
                    <span className="text-white font-mono text-xs">
                      {SUPPORTED_NETWORKS.SEPOLIA.contracts.WETH}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AOT Token:</span>
                    <span className="text-white font-mono text-xs">
                      {SUPPORTED_NETWORKS.SEPOLIA.contracts.AOT_TOKEN}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pool Manager:</span>
                    <span className="text-white font-mono text-xs">
                      {SUPPORTED_NETWORKS.SEPOLIA.contracts.POOL_MANAGER}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-3">Available Functions</h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>• 💰 Deposit ETH</div>
                  <div>• 🔄 Execute Swap (AOT ↔ WETH)</div>
                  <div>• 💸 Withdraw Assets</div>
                  <div>• 📊 View Balances</div>
                  <div>• ⚙️ Admin Functions</div>
                  <div>• 🔒 Emergency Controls</div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-600 pt-4">
              <h4 className="text-white font-semibold mb-2">Usage Instructions</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>1. <strong>Connect Wallet:</strong> Ensure you're connected to Sepolia testnet</p>
                <p>2. <strong>Get Test Tokens:</strong> Acquire Sepolia ETH and test tokens from faucets</p>
                <p>3. <strong>Deposit:</strong> Add ETH to the ExecutorVault for trading</p>
                <p>4. <strong>Execute Swaps:</strong> Test arbitrage swaps between AOT and WETH</p>
                <p>5. <strong>Monitor:</strong> Track your balances and transaction history</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-300">🔧 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Connected Account:</span>
                <div className="text-white font-mono text-xs mt-1">
                  {account?.address || 'Not connected'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Network:</span>
                <div className="text-white mt-1">
                  {networkInfo?.displayName || 'Unknown'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Chain ID:</span>
                <div className="text-white mt-1">
                  {networkInfo?.id || 'Unknown'}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="text-xs text-gray-400 space-y-1">
                <p>Wallet Connected: {wallet ? '✅ Yes' : '❌ No'}</p>
                <p>Account Available: {account ? '✅ Yes' : '❌ No'}</p>
                <p>Sepolia Network: {isSepoliaNetwork ? '✅ Yes' : '❌ No'}</p>
                <p>Loading: {walletLoading ? '🔄 Yes' : '✅ No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}