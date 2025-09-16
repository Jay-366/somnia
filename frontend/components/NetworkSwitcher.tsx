'use client';

import React, { useState, useEffect } from 'react';
import { useActiveWallet, useSwitchActiveWalletChain } from 'thirdweb/react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_NETWORKS, supportedChains, getNetworkById } from '@/lib/networks';
import toast from 'react-hot-toast';

export function NetworkSwitcher() {
  const wallet = useActiveWallet();
  const switchChain = useSwitchActiveWalletChain();
  const [currentNetwork, setCurrentNetwork] = useState<typeof SUPPORTED_NETWORKS.SEPOLIA | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Get current network info
  useEffect(() => {
    const getCurrentNetwork = async () => {
      if (wallet) {
        try {
          const chain = wallet.getChain();
          if (chain) {
            const networkInfo = getNetworkById(chain.id);
            setCurrentNetwork(networkInfo || null);
          }
        } catch (error) {
          console.warn('Failed to get current network:', error);
        }
      }
    };

    getCurrentNetwork();
  }, [wallet]);

  // Switch network function
  const handleNetworkSwitch = async (targetNetwork: typeof SUPPORTED_NETWORKS.SEPOLIA) => {
    if (!wallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (currentNetwork?.id === targetNetwork.id) {
      setIsDropdownOpen(false);
      return;
    }

    setIsSwitching(true);
    
    try {
      // Find the chain definition for thirdweb
      const targetChain = supportedChains.find(chain => chain.id === targetNetwork.id);
      
      if (!targetChain) {
        throw new Error(`Chain configuration not found for ${targetNetwork.name}`);
      }

      // Show loading toast
      const loadingToast = toast.loading(`Switching to ${targetNetwork.displayName}...`);

      // Switch chain using thirdweb
      await switchChain(targetChain);

      // Wait a moment for the chain to actually switch
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update current network state and force a refresh
      setCurrentNetwork(targetNetwork);
      setIsDropdownOpen(false);

      // Force wallet to refresh by triggering a re-render
      if (wallet) {
        try {
          const newChain = wallet.getChain();
          console.log('Switched to chain:', newChain?.id);
        } catch (e) {
          console.warn('Could not verify chain switch:', e);
        }
      }

      // Success toast
      toast.dismiss(loadingToast);
      toast.success(`Successfully switched to ${targetNetwork.displayName}!`);

    } catch (error: any) {
      console.error('Network switch failed:', error);
      
      let errorMessage = 'Failed to switch network';
      if (error.message?.includes('rejected')) {
        errorMessage = 'Network switch was rejected by user';
      } else if (error.message?.includes('unsupported')) {
        errorMessage = `${targetNetwork.displayName} is not supported by your wallet`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSwitching(false);
    }
  };

  // Add network to wallet (if not already added)
  const addNetworkToWallet = async (network: typeof SUPPORTED_NETWORKS.SEPOLIA) => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const chainIdHex = `0x${network.id.toString(16)}`;
      console.log('Adding network:', {
        chainId: chainIdHex,
        chainName: network.displayName,
        rpcUrls: [network.rpcUrl],
        nativeCurrency: network.nativeCurrency,
        blockExplorerUrls: [network.blockExplorer],
      });

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: network.displayName,
          rpcUrls: [network.rpcUrl],
          nativeCurrency: network.nativeCurrency,
          blockExplorerUrls: [network.blockExplorer],
        }],
      });
      
      toast.success(`${network.displayName} added to wallet`);
    } catch (error: any) {
      console.error('Failed to add network:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        data: error.data
      });
      
      if (error.code === 4001) {
        // User rejected the request
        toast.info('Network addition was cancelled');
        return;
      } else if (error.code === -32602) {
        if (error.message?.includes('chainId')) {
          // Network already exists with different parameters
          toast.info(`${network.displayName} is already in your wallet`);
        } else {
          // Other parameter mismatch
          toast.warning(`${network.displayName} configuration mismatch. Try switching directly.`);
        }
      } else if (error.code === -32603) {
        // Internal error
        toast.error('Wallet internal error. Try switching manually.');
      } else {
        toast.error(`Failed to add ${network.displayName}: ${error.message || 'Unknown error'}`);
      }
    }
  };

  if (!wallet) {
    return (
      <div className="flex items-center">
        <Badge variant="outline" className="text-gray-400 border-gray-600">
          🔌 No Wallet
        </Badge>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Network Display */}
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isSwitching}
        variant="outline"
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-200
          ${currentNetwork 
            ? `border-[${currentNetwork.color}] bg-[${currentNetwork.color}]/10 hover:bg-[${currentNetwork.color}]/20` 
            : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
          }
          ${isDropdownOpen ? 'ring-2 ring-[rgb(30,255,195)]/50' : ''}
        `}
      >
        <span className="text-lg">
          {currentNetwork ? currentNetwork.icon : '❓'}
        </span>
        <div className="flex flex-col items-start">
          <span className="text-white text-sm font-medium">
            {currentNetwork ? currentNetwork.displayName : 'Unknown Network'}
          </span>
          <span className="text-xs text-gray-400">
            {currentNetwork ? currentNetwork.description : 'Not supported'}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              🌐 Switch Network
            </h3>
            
            <div className="space-y-2">
              {Object.values(SUPPORTED_NETWORKS).map((network) => {
                const isActive = currentNetwork?.id === network.id;
                
                return (
                  <div key={network.id} className="group">
                    <button
                      onClick={() => handleNetworkSwitch(network)}
                      disabled={isSwitching || isActive}
                      className={`
                        w-full p-3 rounded-lg border transition-all duration-200 text-left
                        ${isActive 
                          ? `border-[${network.color}] bg-[${network.color}]/20` 
                          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
                        }
                        ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{network.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {network.displayName}
                              </span>
                              {isActive && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-green-500/20 text-green-400 border-green-500/30"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {network.description}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Chain ID: {network.id} • {network.nativeCurrency.symbol}
                            </p>
                          </div>
                        </div>
                        
                        {!isActive && (
                          <div className="flex items-center gap-2">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                addNetworkToWallet(network);
                              }}
                              className="text-xs text-[rgb(178,255,238)] hover:text-[rgb(30,255,195)] transition-colors cursor-pointer hover:underline"
                              title="Add to wallet"
                            >
                              + Add
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Network Info */}
            <div className="mt-4 pt-3 border-t border-slate-700">
              <div className="text-xs text-gray-400 space-y-1">
                <p>💡 <strong>Somnia:</strong> For escrow operations with native STT</p>
                <p>🔄 <strong>Sepolia:</strong> For ExecutorVault swaps (AOT ↔ WETH)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

// Simplified version for mobile
export function NetworkSwitcherMobile() {
  const wallet = useActiveWallet();
  const [currentNetwork, setCurrentNetwork] = useState<typeof SUPPORTED_NETWORKS.SEPOLIA | null>(null);

  useEffect(() => {
    const getCurrentNetwork = async () => {
      if (wallet) {
        try {
          const chain = wallet.getChain();
          if (chain) {
            const networkInfo = getNetworkById(chain.id);
            setCurrentNetwork(networkInfo || null);
          }
        } catch (error) {
          console.warn('Failed to get current network:', error);
        }
      }
    };

    getCurrentNetwork();
  }, [wallet]);

  if (!wallet || !currentNetwork) return null;

  return (
    <Badge 
      variant="outline" 
      className={`
        flex items-center gap-1 px-2 py-1 text-xs
        border-[${currentNetwork.color}] bg-[${currentNetwork.color}]/10 text-white
      `}
    >
      <span>{currentNetwork.icon}</span>
      {currentNetwork.name}
    </Badge>
  );
}