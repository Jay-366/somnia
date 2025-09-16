"use client";

import React, { useState, useEffect } from "react";
import { useActiveWallet } from "thirdweb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTokenAmount, truncateAddress } from "@/lib/utils";
import { ContractClient, CONTRACT_ADDRESSES, getContractAddress, isContractAvailable } from "@/lib/contracts";
import { getNetworkById } from "@/lib/networks";

interface TokenBalanceProps {
  tokenAddress: string;
  userAddress: string;
  tokenSymbol: string;
  tokenName: string;
}

export function TokenBalance({ 
  tokenAddress, 
  userAddress, 
  tokenSymbol, 
  tokenName 
}: TokenBalanceProps) {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  
  const wallet = useActiveWallet();

  const fetchBalance = async () => {
    if (!userAddress || !wallet) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current chain info
      const chain = wallet.getChain();
      const chainId = chain?.id;
      setCurrentChainId(chainId || null);
      
      if (!chainId) {
        throw new Error("No network connected");
      }

      // Get network configuration
      const network = getNetworkById(chainId);
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      // Check if this is a network-specific token that might not exist
      const isSepoliaToken = tokenAddress === CONTRACT_ADDRESSES.WETH || tokenAddress === CONTRACT_ADDRESSES.AOT_TOKEN;
      
      if (isSepoliaToken && chainId !== 11155111) {
        throw new Error(`${tokenSymbol} token is only available on Sepolia network`);
      }

      // Use network-specific RPC with fallback
      console.log(`Fetching balance for token ${tokenAddress} on network ${network.name} (${chainId})`);
      console.log(`Using RPC: ${network.rpcUrl}`);
      
      try {
        const contractClient = new ContractClient(network.rpcUrl);
        const balanceStr = await contractClient.getTokenBalance(tokenAddress, userAddress);
        console.log(`Balance fetched: ${balanceStr} ${tokenSymbol}`);
        setBalance(balanceStr);
      } catch (rpcError: any) {
        // If CORS error, try alternative RPC endpoints
        console.warn("Primary RPC failed, trying fallbacks:", rpcError);
        
        const fallbackRpcs = [
          "https://rpc.sepolia.org",
          "https://ethereum-sepolia-rpc.publicnode.com"
        ];
        
        let success = false;
        for (const rpcUrl of fallbackRpcs) {
          try {
            console.log(`Trying fallback RPC: ${rpcUrl}`);
            const contractClient = new ContractClient(rpcUrl);
            const balanceStr = await contractClient.getTokenBalance(tokenAddress, userAddress);
            console.log(`Balance fetched with fallback: ${balanceStr} ${tokenSymbol}`);
            setBalance(balanceStr);
            success = true;
            break;
          } catch (fallbackError) {
            console.warn(`Fallback RPC ${rpcUrl} failed:`, fallbackError);
          }
        }
        
        if (!success) {
          throw rpcError; // Re-throw original error if all fallbacks fail
        }
      }
    } catch (err) {
      console.error("Balance fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [tokenAddress, userAddress, wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for chain changes
  useEffect(() => {
    if (wallet) {
      const checkChain = () => {
        try {
          const chain = wallet.getChain();
          const newChainId = chain?.id;
          if (newChainId && newChainId !== currentChainId) {
            console.log("Chain changed, refetching balance:", newChainId);
            fetchBalance();
          }
        } catch (e) {
          console.warn("Could not check chain:", e);
        }
      };

      // Check periodically for chain changes
      const interval = setInterval(checkChain, 2000);
      return () => clearInterval(interval);
    }
  }, [wallet, currentChainId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{tokenName}</CardTitle>
        <div className="text-xs text-muted-foreground">{tokenSymbol}</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading && (
            <div className="text-2xl font-bold text-muted-foreground">
              Loading...
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          
          {!loading && !error && (
            <>
              <div className="text-2xl font-bold">
                {formatTokenAmount(balance, tokenSymbol)}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Address: {truncateAddress(tokenAddress)}
              </div>
              
              {userAddress && (
                <div className="text-xs text-muted-foreground">
                  Wallet: {truncateAddress(userAddress)}
                </div>
              )}
            </>
          )}
          
          <Button 
            onClick={fetchBalance} 
            disabled={loading || !userAddress}
            size="sm"
            variant="outline"
            className="w-full mt-2"
          >
            {loading ? "Refreshing..." : "Refresh Balance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Pre-configured components for your tokens
export function WETHBalance({ userAddress }: { userAddress: string }) {
  return (
    <TokenBalance
      tokenAddress={CONTRACT_ADDRESSES.WETH}
      userAddress={userAddress}
      tokenSymbol="WETH"
      tokenName="Wrapped Ether"
    />
  );
}

export function AOTBalance({ userAddress }: { userAddress: string }) {
  return (
    <TokenBalance
      tokenAddress={CONTRACT_ADDRESSES.AOT_TOKEN}
      userAddress={userAddress}
      tokenSymbol="AOT"
      tokenName="Attack of Token"
    />
  );
}