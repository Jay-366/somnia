'use client';

import React, { useState, useEffect } from 'react';
import { useActiveWallet } from 'thirdweb/react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTokenAmount, truncateAddress } from "@/lib/utils";
import { ContractClient } from "@/lib/contracts";
import { getNetworkById, SUPPORTED_NETWORKS } from "@/lib/networks";

interface NetworkAwareBalanceProps {
  title: string;
  description?: string;
}

export function NetworkAwareBalance({ title, description }: NetworkAwareBalanceProps) {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  
  const wallet = useActiveWallet();

  const fetchNativeBalance = async () => {
    if (!wallet) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const chain = wallet.getChain();
      const chainId = chain?.id;
      const account = wallet.getAccount();
      
      if (!chainId || !account?.address) {
        throw new Error("Wallet not properly connected");
      }

      const network = getNetworkById(chainId);
      setNetworkInfo(network);
      
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      // Get native balance using thirdweb wallet (avoids CORS issues)
      try {
        // Try to get balance through wallet first (uses thirdweb's RPC handling)
        const balance = await wallet.getBalance();
        if (balance) {
          setBalance(balance.displayValue);
          return;
        }
      } catch (e) {
        console.warn("Failed to get balance through wallet, trying direct RPC:", e);
      }

      // Fallback: use direct provider
      const contractClient = new ContractClient(network.rpcUrl);
      const provider = contractClient['provider']; // Access private provider
      const balanceWei = await provider.getBalance(account.address);
      const balanceEth = ethers.formatEther(balanceWei);
      
      setBalance(balanceEth);
    } catch (err) {
      console.error("Native balance fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNativeBalance();
  }, [wallet]);

  // Check for chain changes
  useEffect(() => {
    if (wallet) {
      const checkChain = () => {
        try {
          const chain = wallet.getChain();
          const newChainId = chain?.id;
          if (newChainId && networkInfo && newChainId !== networkInfo.id) {
            console.log("Chain changed, refetching native balance:", newChainId);
            fetchNativeBalance();
          }
        } catch (e) {
          console.warn("Could not check chain:", e);
        }
      };

      const interval = setInterval(checkChain, 3000);
      return () => clearInterval(interval);
    }
  }, [wallet, networkInfo]);

  if (!wallet) {
    return (
      <Card className="w-full bg-slate-800/30 border-slate-600">
        <CardHeader>
          <CardTitle className="text-slate-400 text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm">Connect wallet to view balance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-slate-800/50 border-slate-600">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-white text-sm font-medium">{title}</CardTitle>
        {networkInfo && (
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: networkInfo.color,
              backgroundColor: `${networkInfo.color}20`,
              color: networkInfo.color
            }}
          >
            {networkInfo.icon} {networkInfo.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading && (
            <div className="text-xl font-bold text-yellow-400">
              🔄 Loading...
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
              ❌ {error}
            </div>
          )}
          
          {!loading && !error && networkInfo && (
            <>
              <div className="text-2xl font-bold text-white">
                {formatTokenAmount(balance, networkInfo.nativeCurrency.symbol)}
              </div>
              
              {description && (
                <div className="text-xs text-slate-400">
                  {description}
                </div>
              )}
              
              <div className="text-xs text-slate-400 space-y-1">
                <div>Network: {networkInfo.displayName}</div>
                <div>Address: {truncateAddress(wallet.getAccount()?.address || '')}</div>
              </div>
            </>
          )}
          
          <Button 
            onClick={fetchNativeBalance} 
            disabled={loading || !wallet}
            size="sm"
            variant="outline"
            className="w-full mt-2 border-slate-600 hover:border-slate-500"
          >
            {loading ? "Refreshing..." : "Refresh Balance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}