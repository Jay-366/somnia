'use client';

import Nav from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveWallet } from 'thirdweb/react';
import { getNetworkById } from '@/lib/networks';
import { WalletDebugInfo } from '@/components/WalletDebugInfo';
import { useState, useEffect } from 'react';

export default function NetworkTestPage() {
  const wallet = useActiveWallet();
  const [currentNetwork, setCurrentNetwork] = useState<any>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const updateNetworkInfo = async () => {
      if (wallet) {
        try {
          const chain = wallet.getChain();
          if (chain) {
            setChainId(chain.id);
            const networkInfo = getNetworkById(chain.id);
            setCurrentNetwork(networkInfo);
          }
        } catch (error) {
          console.error('Failed to get network info:', error);
        }
      } else {
        setCurrentNetwork(null);
        setChainId(null);
      }
    };

    updateNetworkInfo();
    
    // Listen for chain changes
    const interval = setInterval(updateNetworkInfo, 1000);
    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <div className="min-h-screen bg-black">
      <Nav />
      
      <div className="px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-6">
              Network <span className="text-[rgb(30,255,195)]">Switcher</span> Test
            </h1>
            <p className="text-xl text-gray-300">
              Test the network switching functionality
            </p>
          </div>

          <div className="grid gap-6">
            {/* Wallet Debug Info */}
            <WalletDebugInfo />
            
            {/* Current Network Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🌐 Current Network Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!wallet ? (
                  <p className="text-gray-400">Please connect your wallet to see network information</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-gray-400">Chain ID</div>
                        <div className="text-xl font-bold text-white">
                          {chainId || 'Unknown'}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-gray-400">Network Name</div>
                        <div className="text-xl font-bold text-white">
                          {currentNetwork?.displayName || 'Unknown Network'}
                        </div>
                      </div>
                    </div>

                    {currentNetwork && (
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-2">Network Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Icon:</span>
                            <span className="ml-2 text-white">{currentNetwork.icon}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Description:</span>
                            <span className="ml-2 text-white">{currentNetwork.description}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Native Currency:</span>
                            <span className="ml-2 text-white">{currentNetwork.nativeCurrency.symbol}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">RPC URL:</span>
                            <span className="ml-2 text-white text-xs">{currentNetwork.rpcUrl}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentNetwork?.contracts && (
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-gray-400 mb-2">Available Contracts</div>
                        <div className="space-y-2">
                          {Object.entries(currentNetwork.contracts).map(([name, address]) => (
                            <div key={name} className="flex justify-between items-center text-xs">
                              <span className="text-gray-300">{name}:</span>
                              <span className="text-[rgb(30,255,195)] font-mono">
                                {address}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  📋 How to Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="text-[rgb(30,255,195)] font-bold">1.</span>
                    <div>
                      <div className="font-medium">Connect Your Wallet</div>
                      <div className="text-sm text-gray-400">
                        Click the "Connect Wallet" button in the top navigation
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-[rgb(30,255,195)] font-bold">2.</span>
                    <div>
                      <div className="font-medium">Use Network Switcher</div>
                      <div className="text-sm text-gray-400">
                        Click the network button next to the wallet button to see available networks
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-[rgb(30,255,195)] font-bold">3.</span>
                    <div>
                      <div className="font-medium">Switch Networks</div>
                      <div className="text-sm text-gray-400">
                        Try switching between Sepolia (for ExecutorVault) and Somnia (for Escrow)
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-[rgb(30,255,195)] font-bold">4.</span>
                    <div>
                      <div className="font-medium">Verify Information</div>
                      <div className="text-sm text-gray-400">
                        Watch this page update with current network information and available contracts
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Features */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    🔹 Sepolia Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">ExecutorVault contract operations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">AOT ↔ WETH swaps via Uniswap V4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">Token balance management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">WETH ↔ ETH conversions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    🌟 Somnia Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">Native STT escrow operations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">Trusted relayer model</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">Deposit & withdrawal tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[rgb(30,255,195)]">•</span>
                      <span className="text-gray-300">Emergency refund capabilities</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}