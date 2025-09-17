'use client';

import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExecutorVaultContract } from '@/lib/executor-vault-contract';
import { ContractClient, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { ethers } from 'ethers';

export function PoolDebugPanel() {
  const account = useActiveAccount();
  const { getReadOnlyContract } = useExecutorVaultContract();
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkPoolStatus = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const { contract } = await getReadOnlyContract();
      const contractClient = new ContractClient();
      
      // Get pool information
      const poolData = await contract.getPoolInfo();
      console.log('Pool Info:', poolData);
      
      // Get contract balances
      const contractBalances = await contract.getContractBalances();
      console.log('Contract Balances:', contractBalances);
      
      // Get user token balances (not vault balances)
      const wethContract = contractClient.getERC20Contract(CONTRACT_ADDRESSES.WETH);
      const aotContract = contractClient.getERC20Contract(CONTRACT_ADDRESSES.AOT_TOKEN);
      
      const [userWethBalance, userAotBalance] = await Promise.all([
        wethContract.balanceOf(account.address),
        aotContract.balanceOf(account.address)
      ]);
      
      // Get allowances
      const [wethAllowance, aotAllowance] = await Promise.all([
        wethContract.allowance(account.address, CONTRACT_ADDRESSES.EXECUTOR_VAULT),
        aotContract.allowance(account.address, CONTRACT_ADDRESSES.EXECUTOR_VAULT)
      ]);
      
      // Check if pool exists by trying to get pool manager info
      const poolManagerAddress = await contract.POOL_MANAGER();
      console.log('Pool Manager Address:', poolManagerAddress);
      
      setPoolInfo({
        poolData: {
          currency0: poolData[0],
          currency1: poolData[1],
          fee: poolData[2],
          tickSpacing: poolData[3]
        },
        contractBalances: {
          weth: ethers.formatEther(contractBalances[0]),
          aot: ethers.formatEther(contractBalances[1])
        },
        userBalances: {
          weth: ethers.formatEther(userWethBalance),
          aot: ethers.formatEther(userAotBalance)
        },
        allowances: {
          weth: ethers.formatEther(wethAllowance),
          aot: ethers.formatEther(aotAllowance)
        },
        poolManagerAddress,
        addresses: {
          weth: CONTRACT_ADDRESSES.WETH,
          aot: CONTRACT_ADDRESSES.AOT_TOKEN,
          vault: CONTRACT_ADDRESSES.EXECUTOR_VAULT
        }
      });
      
    } catch (error) {
      console.error('Pool status check failed:', error);
      setPoolInfo({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🔍 Pool Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkPoolStatus}
          disabled={loading || !account}
          className="w-full"
        >
          {loading ? "Checking Pool Status..." : "Check Pool & Contract Status"}
        </Button>
        
        {poolInfo && (
          <div className="space-y-4 text-sm">
            {poolInfo.error ? (
              <div className="p-3 bg-red-900/20 border border-red-600/30 rounded text-red-400">
                Error: {poolInfo.error}
              </div>
            ) : (
              <>
                {/* Pool Configuration */}
                <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded">
                  <h4 className="text-blue-400 font-semibold mb-2">Pool Configuration</h4>
                  <div className="space-y-1 text-blue-300">
                    <div>Currency0: {poolInfo.poolData.currency0}</div>
                    <div>Currency1: {poolInfo.poolData.currency1}</div>
                    <div>Fee: {poolInfo.poolData.fee} ({(poolInfo.poolData.fee / 10000).toFixed(2)}%)</div>
                    <div>Tick Spacing: {poolInfo.poolData.tickSpacing}</div>
                  </div>
                </div>

                {/* Contract Balances */}
                <div className="p-3 bg-green-900/20 border border-green-600/30 rounded">
                  <h4 className="text-green-400 font-semibold mb-2">Contract Token Balances</h4>
                  <div className="space-y-1 text-green-300">
                    <div>WETH: {poolInfo.contractBalances.weth}</div>
                    <div>AOT: {poolInfo.contractBalances.aot}</div>
                  </div>
                </div>

                {/* User Balances */}
                <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded">
                  <h4 className="text-yellow-400 font-semibold mb-2">Your Token Balances</h4>
                  <div className="space-y-1 text-yellow-300">
                    <div>WETH: {poolInfo.userBalances.weth}</div>
                    <div>AOT: {poolInfo.userBalances.aot}</div>
                  </div>
                </div>

                {/* Allowances */}
                <div className="p-3 bg-purple-900/20 border border-purple-600/30 rounded">
                  <h4 className="text-purple-400 font-semibold mb-2">Token Allowances</h4>
                  <div className="space-y-1 text-purple-300">
                    <div>WETH Allowance: {poolInfo.allowances.weth}</div>
                    <div>AOT Allowance: {poolInfo.allowances.aot}</div>
                  </div>
                </div>

                {/* Contract Addresses */}
                <div className="p-3 bg-slate-700/50 rounded">
                  <h4 className="text-slate-300 font-semibold mb-2">Contract Addresses</h4>
                  <div className="space-y-1 text-slate-400 text-xs font-mono">
                    <div>WETH: {poolInfo.addresses.weth}</div>
                    <div>AOT: {poolInfo.addresses.aot}</div>
                    <div>Vault: {poolInfo.addresses.vault}</div>
                    <div>Pool Manager: {poolInfo.poolManagerAddress}</div>
                  </div>
                </div>

                {/* Potential Issues */}
                <div className="p-3 bg-orange-900/20 border border-orange-600/30 rounded">
                  <h4 className="text-orange-400 font-semibold mb-2">Potential Issues</h4>
                  <div className="space-y-1 text-orange-300 text-xs">
                    {parseFloat(poolInfo.userBalances.aot) === 0 && (
                      <div>⚠️ You have no AOT tokens to swap</div>
                    )}
                    {parseFloat(poolInfo.allowances.aot) === 0 && (
                      <div>⚠️ AOT allowance is 0, approval needed</div>
                    )}
                    {parseFloat(poolInfo.contractBalances.weth) === 0 && parseFloat(poolInfo.contractBalances.aot) === 0 && (
                      <div>⚠️ Contract has no token balances - pool might not be initialized</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}