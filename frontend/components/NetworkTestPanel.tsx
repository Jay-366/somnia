'use client';

import React, { useState } from 'react';
import { useActiveWallet } from 'thirdweb/react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNetworkById } from "@/lib/networks";

export function NetworkTestPanel() {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const wallet = useActiveWallet();

  const runNetworkTest = async () => {
    if (!wallet) return;
    
    setTesting(true);
    const results: any = {};
    
    try {
      // Get current network
      const chain = wallet.getChain();
      const chainId = chain?.id;
      const account = wallet.getAccount();
      
      results.chainId = chainId;
      results.address = account?.address;
      
      const network = getNetworkById(chainId!);
      results.networkConfig = network;
      
      if (network) {
        // Test RPC connection
        try {
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const blockNumber = await provider.getBlockNumber();
          results.rpcTest = { success: true, blockNumber };
          
          // Test native balance
          if (account?.address) {
            const balance = await provider.getBalance(account.address);
            results.nativeBalance = {
              wei: balance.toString(),
              formatted: ethers.formatEther(balance),
              symbol: network.nativeCurrency.symbol
            };
          }
          
        } catch (error: any) {
          results.rpcTest = { success: false, error: error.message };
        }
        
        // Test specific contracts for this network
        if (chainId === 11155111) { // Sepolia
          results.contractTests = await testSepoliaContracts(network.rpcUrl, account?.address);
        } else if (chainId === 50312) { // Somnia
          results.contractTests = await testSomniaContracts(network.rpcUrl, account?.address);
        }
      }
      
    } catch (error: any) {
      results.error = error.message;
    }
    
    setTestResults(results);
    setTesting(false);
  };

  return (
    <Card className="w-full bg-slate-800/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white">🔧 Network Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runNetworkTest}
          disabled={testing || !wallet}
          className="w-full"
        >
          {testing ? "Running Tests..." : "Test Current Network"}
        </Button>
        
        {testResults && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Chain ID:</span>
                <div className="text-white">{testResults.chainId}</div>
              </div>
              <div>
                <span className="text-gray-400">Address:</span>
                <div className="text-white font-mono text-xs">
                  {testResults.address?.slice(0, 10)}...
                </div>
              </div>
            </div>
            
            {testResults.networkConfig && (
              <div>
                <span className="text-gray-400">Network:</span>
                <Badge className="ml-2">
                  {testResults.networkConfig.icon} {testResults.networkConfig.displayName}
                </Badge>
              </div>
            )}
            
            {testResults.rpcTest && (
              <div className={`p-2 rounded ${testResults.rpcTest.success ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                <div className={testResults.rpcTest.success ? 'text-green-400' : 'text-red-400'}>
                  RPC: {testResults.rpcTest.success ? '✅ Connected' : '❌ Failed'}
                </div>
                {testResults.rpcTest.success && (
                  <div className="text-xs text-gray-400">Block: {testResults.rpcTest.blockNumber}</div>
                )}
                {testResults.rpcTest.error && (
                  <div className="text-xs text-red-300">{testResults.rpcTest.error}</div>
                )}
              </div>
            )}
            
            {testResults.nativeBalance && (
              <div className="p-2 bg-blue-900/20 rounded">
                <div className="text-blue-400">💰 Native Balance</div>
                <div className="text-white">
                  {testResults.nativeBalance.formatted} {testResults.nativeBalance.symbol}
                </div>
              </div>
            )}
            
            {testResults.contractTests && (
              <div className="p-2 bg-purple-900/20 rounded">
                <div className="text-purple-400">📋 Contract Tests</div>
                <div className="space-y-1 text-xs">
                  {Object.entries(testResults.contractTests).map(([key, result]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                        {result.success ? '✅' : '❌'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {testResults.error && (
              <div className="p-2 bg-red-900/20 rounded text-red-400">
                ❌ Error: {testResults.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function testSepoliaContracts(rpcUrl: string, userAddress?: string) {
  const results: any = {};
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const contracts = {
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    AOT_TOKEN: "0xD98f9971773045735C62cD8f1a70047f81b9a468",
    POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
  };
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      const code = await provider.getCode(address);
      const hasContract = code !== "0x";
      results[name] = { success: hasContract, address };
      
      // Test token contract specifically
      if (hasContract && userAddress && (name === 'WETH' || name === 'AOT_TOKEN')) {
        try {
          const contract = new ethers.Contract(address, [
            "function balanceOf(address) view returns (uint256)",
            "function symbol() view returns (string)"
          ], provider);
          
          const [balance, symbol] = await Promise.all([
            contract.balanceOf(userAddress),
            contract.symbol()
          ]);
          
          results[name].balance = ethers.formatUnits(balance, 18);
          results[name].symbol = symbol;
        } catch (e) {
          results[name].tokenError = (e as Error).message;
        }
      }
    } catch (error) {
      results[name] = { success: false, error: (error as Error).message };
    }
  }
  
  return results;
}

async function testSomniaContracts(rpcUrl: string, userAddress?: string) {
  const results: any = {};
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Somnia mainly has the escrow contract
  const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  try {
    if (escrowAddress !== "0x0000000000000000000000000000000000000000") {
      const code = await provider.getCode(escrowAddress);
      results.ESCROW_NATIVE = { success: code !== "0x", address: escrowAddress };
    } else {
      results.ESCROW_NATIVE = { success: false, error: "No escrow address configured" };
    }
  } catch (error) {
    results.ESCROW_NATIVE = { success: false, error: (error as Error).message };
  }
  
  return results;
}