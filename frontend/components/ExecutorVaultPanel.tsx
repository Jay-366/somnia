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
  const [depositToken, setDepositToken] = useState<'WETH' | 'AOT'>('WETH');
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

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
      
      console.log('Swap Debug Info:', {
        swapAmount,
        swapAmountWei: swapAmountWei.toString(),
        currentAllowance: currentAllowance.toString(),
        needsApproval: currentAllowance < swapAmountWei,
        userAddress: account.address,
        vaultAddress: CONTRACT_ADDRESSES.EXECUTOR_VAULT
      });
      
      if (currentAllowance < swapAmountWei) {
        toast.loading('Approving AOT spending...');
        const approveTx = await aotContract.approve(CONTRACT_ADDRESSES.EXECUTOR_VAULT, ethers.MaxUint256);
        await approveTx.wait();
        toast.dismiss();
        console.log('AOT approval completed');
      }
      
      // Check vault balances before swap
      const vaultBalances = await vaultService.getUserBalances(account.address);
      console.log('Vault balances before swap:', vaultBalances);
      
      if (parseFloat(vaultBalances.aotBalance) < parseFloat(swapAmount)) {
        throw new Error(`Insufficient AOT balance in vault. Available: ${vaultBalances.aotBalance}, Required: ${swapAmount}`);
      }
      
      // Execute swap
      toast.loading('Executing AOT → WETH swap...');
      console.log('Attempting swap with amount:', swapAmount);
      
      // Try to estimate gas first to get better error info
      try {
        const gasEstimate = await contract.executeSwap.estimateGas(swapAmountWei);
        console.log('Gas estimate successful:', gasEstimate.toString());
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        
        // Try to get more specific error info
        try {
          await contract.executeSwap.staticCall(swapAmountWei);
        } catch (staticError: any) {
          console.error('Static call failed:', staticError);
          throw new Error(`Swap simulation failed: ${staticError.reason || staticError.message || 'Unknown reason'}`);
        }
        
        throw new Error(`Gas estimation failed: ${gasError.reason || gasError.message || 'Unknown reason'}`);
      }
      
      const swapTx = await vaultService.executeSwap(swapAmount);
      await swapTx.wait();
      
      toast.success(`Successfully swapped ${swapAmount} AOT to WETH!`);
      
      // Reload balances
      await loadVaultData();
      setSwapAmount("");
      
    } catch (error: any) {
      console.error('Swap error:', error);
      
      let errorMessage = 'Unknown error';
      if (error.message?.includes('insufficient')) {
        errorMessage = error.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transaction reverted. This could be due to insufficient liquidity, slippage, or pool configuration issues.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Swap failed: ${errorMessage}`);
    } finally {
      setSwapLoading(false);
      toast.dismiss();
    }
  };

  // Deposit tokens
  const executeDeposit = async () => {
    if (!account || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    setDepositLoading(true);
    try {
      const { contract, signer } = await getContract();
      const vaultService = new ExecutorVaultService(contract, signer);
      const contractClient = new ContractClient(undefined, signer);
      
      const tokenAddress = depositToken === 'WETH' ? CONTRACT_ADDRESSES.WETH : CONTRACT_ADDRESSES.AOT_TOKEN;
      
      // Approve token spending first
      const tokenContract = contractClient.getERC20Contract(tokenAddress, true);
      const currentAllowance = await tokenContract.allowance(account.address, CONTRACT_ADDRESSES.EXECUTOR_VAULT);
      const depositAmountWei = ethers.parseEther(depositAmount);
      
      if (currentAllowance < depositAmountWei) {
        toast.loading(`Approving ${depositToken} spending...`);
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.EXECUTOR_VAULT, ethers.MaxUint256);
        await approveTx.wait();
        toast.dismiss();
      }
      
      // Execute deposit
      toast.loading(`Depositing ${depositAmount} ${depositToken}...`);
      const depositTx = await vaultService.deposit(tokenAddress, depositAmount);
      await depositTx.wait();
      
      toast.success(`Successfully deposited ${depositAmount} ${depositToken}!`);
      
      // Reload balances
      await loadVaultData();
      setDepositAmount("");
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(`Deposit failed: ${error.message || 'Unknown error'}`);
    } finally {
      setDepositLoading(false);
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
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            🏦 ExecutorVault Dashboard
            <Badge variant="secondary" className="bg-green-600 text-white">Sepolia</Badge>
          </CardTitle>
          <CardDescription className="text-gray-300">
            AOT → WETH swap vault with balance tracking and liquidity management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-yellow-400 text-lg">🔄 Loading vault data...</div>
            </div>
          ) : (
            <>
              {/* User Balances */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                  <div className="text-sm text-blue-300">Your WETH Balance</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatTokenAmount(balances.wethBalance, "WETH")}
                  </div>
                  <div className="text-xs text-blue-300/70 mt-1">
                    ${(parseFloat(balances.wethBalance) * 1847).toFixed(2)} USD
                  </div>
                </div>
                <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                  <div className="text-sm text-green-300">Your AOT Balance</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatTokenAmount(balances.aotBalance, "AOT")}
                  </div>
                  <div className="text-xs text-green-300/70 mt-1">
                    ${(parseFloat(balances.aotBalance) * 0.85).toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Vault Info */}
              {vaultInfo && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">📊 Vault Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Pool Fee:</span>
                      <span className="text-white font-medium">{vaultInfo.poolFee / 100}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tick Spacing:</span>
                      <span className="text-white font-medium">{vaultInfo.tickSpacing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total WETH:</span>
                      <span className="text-blue-400 font-medium">{formatTokenAmount(vaultInfo.totalWETH, "WETH")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total AOT:</span>
                      <span className="text-green-400 font-medium">{formatTokenAmount(vaultInfo.totalAOT, "AOT")}</span>
                    </div>
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
            className="w-full border-slate-600 hover:border-slate-500 text-white"
          >
            {loading ? "Refreshing..." : "🔄 Refresh Balances"}
          </Button>
        </CardContent>
      </Card>

      {/* Action Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Deposit Card */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              💰 Deposit Tokens
            </CardTitle>
            <CardDescription className="text-gray-300">
              Add WETH or AOT tokens to your vault balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Token to Deposit</label>
              <select
                value={depositToken}
                onChange={(e) => setDepositToken(e.target.value as 'WETH' | 'AOT')}
                className="w-full p-3 border border-slate-600 bg-slate-700 text-white rounded-lg mt-1"
              >
                <option value="WETH">WETH (Wrapped Ether)</option>
                <option value="AOT">AOT (Attack of Token)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Amount to Deposit</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Enter ${depositToken} amount`}
                  className="w-full p-3 border border-slate-600 bg-slate-700 text-white rounded-lg pr-20"
                  step="0.01"
                  min="0"
                />
                <div className="absolute right-3 top-3 text-gray-400">{depositToken}</div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setDepositAmount("0.1")}
                  className="text-xs px-2 py-1 bg-slate-600 text-gray-300 rounded hover:bg-slate-500"
                >
                  0.1
                </button>
                <button
                  onClick={() => setDepositAmount("1.0")}
                  className="text-xs px-2 py-1 bg-slate-600 text-gray-300 rounded hover:bg-slate-500"
                >
                  1.0
                </button>
                <button
                  onClick={() => setDepositAmount("5.0")}
                  className="text-xs px-2 py-1 bg-slate-600 text-gray-300 rounded hover:bg-slate-500"
                >
                  5.0
                </button>
              </div>
            </div>
            
            <Button 
              onClick={executeDeposit}
              disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {depositLoading ? "Depositing..." : `Deposit ${depositToken}`}
            </Button>
          </CardContent>
        </Card>

        {/* Swap Card */}
        <Card className="bg-slate-800/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🔄 AOT → WETH Swap
            </CardTitle>
            <CardDescription className="text-gray-300">
              Swap your AOT tokens for WETH via Uniswap V4 pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">AOT Amount to Swap</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="Enter AOT amount"
                  className="w-full p-3 border border-slate-600 bg-slate-700 text-white rounded-lg pr-16"
                  step="0.01"
                  min="0"
                  max={balances.aotBalance}
                />
                <div className="absolute right-3 top-3 text-gray-400">AOT</div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-400">
                  Available: {formatTokenAmount(balances.aotBalance, "AOT")}
                </div>
                <button
                  onClick={() => setSwapAmount(balances.aotBalance)}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
                  disabled={parseFloat(balances.aotBalance) <= 0}
                >
                  Max
                </button>
              </div>
            </div>
            
            <Button 
              onClick={executeSwap}
              disabled={swapLoading || !swapAmount || parseFloat(swapAmount) <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {swapLoading ? "Swapping..." : "Execute Swap"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Card */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            💸 Withdraw Tokens
          </CardTitle>
          <CardDescription className="text-gray-300">
            Withdraw your tokens from the vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">Token to Withdraw</label>
            <select
              value={withdrawToken}
              onChange={(e) => setWithdrawToken(e.target.value as 'WETH' | 'AOT')}
              className="w-full p-3 border border-slate-600 bg-slate-700 text-white rounded-lg mt-1"
            >
              <option value="WETH">WETH (Wrapped Ether)</option>
              <option value="AOT">AOT (Attack of Token)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">Amount to Withdraw</label>
            <div className="relative mt-1">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Enter ${withdrawToken} amount`}
                className="w-full p-3 border border-slate-600 bg-slate-700 text-white rounded-lg pr-20"
                step="0.01"
                min="0"
                max={withdrawToken === 'WETH' ? balances.wethBalance : balances.aotBalance}
              />
              <div className="absolute right-3 top-3 text-gray-400">{withdrawToken}</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Available: {withdrawToken === 'WETH' ? formatTokenAmount(balances.wethBalance, "WETH") : formatTokenAmount(balances.aotBalance, "AOT")}
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
              <label htmlFor="unwrapWETH" className="text-sm text-gray-300">
                Unwrap WETH to ETH
              </label>
            </div>
          )}
          
          <Button 
            onClick={executeWithdraw}
            disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {withdrawLoading ? "Withdrawing..." : `Withdraw ${withdrawToken}${withdrawToken === 'WETH' && unwrapWETH ? ' as ETH' : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}