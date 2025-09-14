"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTokenAmount, truncateAddress } from "@/lib/utils";
import { ContractClient, CONTRACT_ADDRESSES } from "@/lib/contracts";

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

  const fetchBalance = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const contractClient = new ContractClient();
      const balanceStr = await contractClient.getTokenBalance(tokenAddress, userAddress);
      setBalance(balanceStr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [tokenAddress, userAddress]); // eslint-disable-line react-hooks/exhaustive-deps

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