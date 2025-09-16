'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveAccount } from 'thirdweb/react';
import { useExecutorVaultContract, ExecutorVaultService } from '@/lib/executor-vault-contract';
import { ContractClient, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatTokenAmount, truncateAddress } from '@/lib/utils';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface VaultBalances {
  wethBalance: string;
  aotBalance: string;
}

interface VaultInfo {
  poolFee: number;
  tickSpacing: number;
  owner: string;
  totalWETH: string;
  totalAOT: string;
}

export function ExecutorVaultPanel() {
  const account = useActiveAccount();
  const { getContract, getReadOnlyContract } = useExecutorVaultContract();
  
  // State
  const [balances, setBalances] = useState<VaultBalances>({ wethBalance: "0", aotBalance: "0" });
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  // Form states
  const [swapAmount, setSwapAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState<'WETH' | 'AOT'>('WETH');
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [unwrapWETH, setUnwrapWETH] = useState(false);

  // Load vault data
  const loadVaultData = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const { contract } = await getReadOnlyContract();
      const vaultService = new ExecutorVaultService(contract, {} as any);
      
      // Get user balances
      const userBalances = await vaultService.getUserBalances(account.address);
      setBalances(userBalances);
      
      // Get vault info
      const [vaultConfig, totalBalances] = await Promise.all([
        vaultService.getVaultInfo(),
        vaultService.getTotalBalances()
      ]);
      
      setVaultInfo({
        poolFee: vaultConfig.poolFee,
        tickSpacing: vaultConfig.tickSpacing,
        owner: vaultConfig.owner,
        totalWETH: totalBalances.wethTotal,
        totalAOT: totalBalances.aotTotal
      });
      
    } catch (error) {
      console.error('Error loading vault data:', error);
      toast.error('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  // Execute AOT → WETH swap
  const executeSwap = async () => {
    if (!account || !swapAmount || parseFloat(swapAmount) <= 0) {
      toast.error('Please enter a valid swap amount');
      return;
    }

    setSwapLoading(true);
    try {
      const { contract, signer } = await getContract();
      const vaultService = new ExecutorVaultService(contract, signer);
      
      // First approve AOT spending
      const contractClient = new ContractClient(undefined, signer);
      const aotContract = contractClient.getERC20Contract(CONTRACT_ADDRESSES.AOT_TOKEN, true);
      
      // Check if approval is needed
      const currentAllowance = await aotContract.allowance(account.address, CONTRACT_ADDRESSES.EXECUTOR_VAULT);
      const swapAmountWei = ethers.parseEther(swapAmount);
      
      if (currentAllowance < swapAmountWei) {
        toast.loading('Approving AOT spending...');
        const approveTx = await aotContract.approve(CONTRACT_ADDRESSES.EXECUTOR_VAULT, ethers.MaxUint256);
        await approveTx.wait();
        toast.dismiss();
      }
      
      // Execute swap
      toast.loading('Executing AOT → WETH swap...');
      const swapTx = await vaultService.executeSwap(swapAmount);
      await swapTx.wait();
      
      toast.success(`Successfully swapped ${swapAmount} AOT to WETH!`);
      
      // Reload balances
      await loadVaultData();
      setSwapAmount("");
      
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error(`Swap failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSwapLoading(false);
      toast.dismiss();
    }
  };

  // Withdraw tokens
  const executeWithdraw = async () => {
    if (!account || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    setWithdrawLoading(true);
    try {
      const { contract, signer } = await getContract();
      const vaultService = new ExecutorVaultService(contract, signer);
      
      const tokenAddress = withdrawToken === 'WETH' ? CONTRACT_ADDRESSES.WETH : CONTRACT_ADDRESSES.AOT_TOKEN;
      const shouldUnwrap = withdrawToken === 'WETH' && unwrapWETH;
      
      toast.loading(`Withdrawing ${withdrawAmount} ${withdrawToken}${shouldUnwrap ? ' as ETH' : ''}...`);
      
      const withdrawTx = await vaultService.withdraw(tokenAddress, withdrawAmount, shouldUnwrap);
      await withdrawTx.wait();
      
      toast.success(`Successfully withdrew ${withdrawAmount} ${withdrawToken}${shouldUnwrap ? ' as ETH' : ''}!`);
      
      // Reload balances
      await loadVaultData();
      setWithdrawAmount("");
      
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(`Withdrawal failed: ${error.message || 'Unknown error'}`);
    } finally {
      setWithdrawLoading(false);
      toast.dismiss();
    }
  };

  // Load data on mount and account change
  useEffect(() => {
    if (account) {
      loadVaultData();
    }
  }, [account]);

  if (!account) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🏦 ExecutorVault</CardTitle>
          <CardDescription>Connect your wallet to access the vault</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please connect your wallet to view your vault balances and perform swaps.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vault Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏦 ExecutorVault
            <Badge variant="secondary">Sepolia</Badge>
          </CardTitle>
          <CardDescription>
            AOT → WETH swap vault with balance tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading vault data...</p>
          ) : (
            <>
              {/* User Balances */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-muted-foreground">Your WETH Balance</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTokenAmount(balances.wethBalance, "WETH")}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-sm text-muted-foreground">Your AOT Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatTokenAmount(balances.aotBalance, "AOT")}
                  </div>
                </div>
              </div>

              {/* Vault Info */}
              {vaultInfo && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pool Fee:</span>
                    <span className="ml-2 font-medium">{vaultInfo.poolFee / 100}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tick Spacing:</span>
                    <span className="ml-2 font-medium">{vaultInfo.tickSpacing}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total WETH:</span>
                    <span className="ml-2 font-medium">{formatTokenAmount(vaultInfo.totalWETH, "WETH")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total AOT:</span>
                    <span className="ml-2 font-medium">{formatTokenAmount(vaultInfo.totalAOT, "AOT")}</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          <Button 
            onClick={loadVaultData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {loading ? "Refreshing..." : "Refresh Balances"}
          </Button>
        </CardContent>
      </Card>

      {/* Swap Card */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 AOT → WETH Swap</CardTitle>
          <CardDescription>
            Swap your AOT tokens for WETH via Uniswap V4 pool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">AOT Amount to Swap</label>
            <div className="relative mt-1">
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                placeholder="Enter AOT amount"
                className="w-full p-3 border rounded-lg pr-16"
                step="0.01"
                min="0"
              />
              <div className="absolute right-3 top-3 text-muted-foreground">AOT</div>
            </div>
          </div>
          
          <Button 
            onClick={executeSwap}
            disabled={swapLoading || !swapAmount || parseFloat(swapAmount) <= 0}
            className="w-full"
          >
            {swapLoading ? "Swapping..." : "Execute Swap"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw Card */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Withdraw Tokens</CardTitle>
          <CardDescription>
            Withdraw your tokens from the vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Token to Withdraw</label>
            <select
              value={withdrawToken}
              onChange={(e) => setWithdrawToken(e.target.value as 'WETH' | 'AOT')}
              className="w-full p-3 border rounded-lg mt-1"
            >
              <option value="WETH">WETH</option>
              <option value="AOT">AOT</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Amount to Withdraw</label>
            <div className="relative mt-1">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Enter ${withdrawToken} amount`}
                className="w-full p-3 border rounded-lg pr-20"
                step="0.01"
                min="0"
                max={withdrawToken === 'WETH' ? balances.wethBalance : balances.aotBalance}
              />
              <div className="absolute right-3 top-3 text-muted-foreground">{withdrawToken}</div>
            </div>
          </div>

          {withdrawToken === 'WETH' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unwrapWETH"
                checked={unwrapWETH}
                onChange={(e) => setUnwrapWETH(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="unwrapWETH" className="text-sm">
                Unwrap WETH to ETH
              </label>
            </div>
          )}
          
          <Button 
            onClick={executeWithdraw}
            disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            className="w-full"
            variant="secondary"
          >
            {withdrawLoading ? "Withdrawing..." : `Withdraw ${withdrawToken}${withdrawToken === 'WETH' && unwrapWETH ? ' as ETH' : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}