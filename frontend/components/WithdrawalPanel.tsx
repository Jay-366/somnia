'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Wallet2, ArrowRightLeft, Zap, Rocket, RefreshCw, Coins, Banknote } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { useExecutorVaultContract, ExecutorVaultService } from '@/lib/executor-vault-contract';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatTokenAmount, truncateAddress } from '@/lib/utils';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface VaultBalances {
  wethBalance: string;
  aotBalance: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  isNative?: boolean;
}

export function WithdrawalPanel() {
  const account = useActiveAccount();
  const { getContract, getReadOnlyContract } = useExecutorVaultContract();
  
  // State
  const [balances, setBalances] = useState<VaultBalances>({ wethBalance: "0", aotBalance: "0" });
  const [userBalances, setUserBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  // Form states
  const [withdrawToken, setWithdrawToken] = useState<'WETH' | 'AOT'>('WETH');
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [unwrapWETH, setUnwrapWETH] = useState(false);

  // Load vault balances
  const loadVaultBalances = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const contractData = await getReadOnlyContract();
      if (!contractData) {
        console.error('Failed to get contract instance');
        return;
      }

      const vaultService = new ExecutorVaultService(contractData.contract, contractData.provider as any);
      
      // Get user vault balances
      const userBalances = await vaultService.getUserBalances(account.address);

      setBalances({
        wethBalance: ethers.parseEther(userBalances.wethBalance).toString(),
        aotBalance: ethers.parseEther(userBalances.aotBalance).toString()
      });

      console.log('✅ Vault balances loaded:', { 
        weth: userBalances.wethBalance, 
        aot: userBalances.aotBalance 
      });

    } catch (error) {
      console.error('❌ Error loading vault data:', error);
      toast.error('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  // Load user token balances
  const loadUserBalances = async () => {
    if (!account?.address) return;

    try {
      // Get provider for Sepolia
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.sepolia.org'
      );

      const balancePromises = [
        // ETH balance
        provider.getBalance(account.address).then(balance => ({
          symbol: 'ETH',
          balance: balance.toString(),
          address: 'native',
          isNative: true
        })),
        // WETH balance
        (async () => {
          const wethContract = new ethers.Contract(
            CONTRACT_ADDRESSES.WETH,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          const balance = await wethContract.balanceOf(account.address);
          return {
            symbol: 'WETH',
            balance: balance.toString(),
            address: CONTRACT_ADDRESSES.WETH
          };
        })(),
        // AOT balance
        (async () => {
          const aotContract = new ethers.Contract(
            CONTRACT_ADDRESSES.AOT_TOKEN,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          const balance = await aotContract.balanceOf(account.address);
          return {
            symbol: 'AOT',
            balance: balance.toString(),
            address: CONTRACT_ADDRESSES.AOT_TOKEN
          };
        })()
      ];

      const results = await Promise.all(balancePromises);
      setUserBalances(results);

    } catch (error) {
      console.error('Error checking balances:', error);
    }
  };

  // Withdrawal function
  const handleWithdraw = async () => {
    if (!account || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    setWithdrawLoading(true);
    try {
      const contractData = await getContract();
      if (!contractData) {
        toast.error('Failed to get contract instance');
        return;
      }

      const vaultService = new ExecutorVaultService(contractData.contract, contractData.signer);

      let txHash: string;
      
      if (withdrawToken === 'WETH') {
        if (unwrapWETH) {
          // Withdraw and unwrap WETH to ETH
          const tx = await vaultService.withdrawETH(withdrawAmount);
          txHash = tx.hash;
          toast.success(`Withdrawing ${withdrawAmount} ETH (unwrapped from WETH)...`);
        } else {
          // Withdraw WETH as WETH
          const tx = await vaultService.withdrawWETH(withdrawAmount);
          txHash = tx.hash;
          toast.success(`Withdrawing ${withdrawAmount} WETH...`);
        }
      } else {
        // Withdraw AOT
        const tx = await vaultService.withdrawAOT(withdrawAmount);
        txHash = tx.hash;
        toast.success(`Withdrawing ${withdrawAmount} AOT...`);
      }

      // Wait for transaction confirmation
      const receipt = await contractData.provider.waitForTransaction(txHash);
      
      if (receipt?.status === 1) {
        toast.success(
          `Successfully withdrew ${withdrawAmount} ${unwrapWETH && withdrawToken === 'WETH' ? 'ETH' : withdrawToken}!`
        );
        setWithdrawAmount("");
        await Promise.all([loadVaultBalances(), loadUserBalances()]);
      } else {
        toast.error('Withdrawal transaction failed');
      }

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(`Withdrawal failed: ${error.message || 'Unknown error'}`);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Load data on mount and when account changes
  useEffect(() => {
    if (account) {
      loadVaultBalances();
      loadUserBalances();
    }
  }, [account]);

  if (!account) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-600/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgb(30,255,195)]/20 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-[rgb(30,255,195)]" />
              </div>
              Withdrawal
            </CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Withdraw your tokens from the ExecutorVault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[rgb(30,255,195)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet2 className="w-10 h-10 text-[rgb(30,255,195)]" />
              </div>
              <p className="text-white text-lg font-medium">Connect your wallet to access withdrawal functionality</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Withdrawal Interface */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-600/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgb(30,255,195)]/20 rounded-full flex items-center justify-center">
              <Coins className="w-5 h-5 text-[rgb(30,255,195)]" />
            </div>
            Withdraw Funds
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            Withdraw your tokens from the ExecutorVault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <div>
            <label className="block text-base font-semibold text-white mb-3">
              Select Token to Withdraw:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setWithdrawToken('WETH')}
                variant={withdrawToken === 'WETH' ? 'default' : 'outline'}
                className={`h-12 text-base font-semibold transition-all duration-200 ${
                  withdrawToken === 'WETH'
                    ? 'bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 shadow-lg shadow-[rgb(30,255,195)]/25'
                    : 'border-slate-500 text-white hover:border-[rgb(30,255,195)] hover:text-[rgb(30,255,195)] bg-slate-800/50'
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                WETH
              </Button>
              <Button
                onClick={() => setWithdrawToken('AOT')}
                variant={withdrawToken === 'AOT' ? 'default' : 'outline'}
                className={`h-12 text-base font-semibold transition-all duration-200 ${
                  withdrawToken === 'AOT'
                    ? 'bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 shadow-lg shadow-[rgb(30,255,195)]/25'
                    : 'border-slate-500 text-white hover:border-[rgb(30,255,195)] hover:text-[rgb(30,255,195)] bg-slate-800/50'
                }`}
              >
                <Rocket className="w-4 h-4 mr-2" />
                AOT
              </Button>
            </div>
          </div>

          {/* Unwrap Option for WETH */}
          {withdrawToken === 'WETH' && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600/30">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="unwrapWETH"
                  checked={unwrapWETH}
                  onChange={(e) => setUnwrapWETH(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-500 bg-slate-700 text-[rgb(30,255,195)] focus:ring-[rgb(30,255,195)] focus:ring-2"
                />
                <label htmlFor="unwrapWETH" className="text-white font-medium">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Unwrap WETH to ETH
                </label>
              </div>
              <p className="text-sm text-gray-300 mt-2 ml-8">
                Convert WETH to native ETH during withdrawal
              </p>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-base font-semibold text-white mb-3">
              Amount to Withdraw:
            </label>
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Enter ${withdrawToken} amount`}
                className="w-full h-14 bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 pr-20 text-white placeholder-gray-400 focus:border-[rgb(30,255,195)] focus:outline-none focus:ring-2 focus:ring-[rgb(30,255,195)]/20 text-lg font-medium transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.001"
                min="0"
              />
              <Button
                onClick={() => {
                  const balance = withdrawToken === 'WETH' ? balances.wethBalance : balances.aotBalance;
                  setWithdrawAmount(ethers.formatEther(balance));
                }}
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-3 text-[rgb(30,255,195)] hover:text-white hover:bg-[rgb(30,255,195)]/20 font-semibold"
              >
                MAX
              </Button>
            </div>
            <div className="mt-2 text-sm text-gray-300">
              Available: <span className="text-[rgb(30,255,195)] font-medium">
                {formatTokenAmount(
                  ethers.formatEther(withdrawToken === 'WETH' ? balances.wethBalance : balances.aotBalance), 
                  withdrawToken, 
                  6
                )}
              </span>
            </div>
          </div>

          {/* Withdraw Button */}
          <Button
            onClick={handleWithdraw}
            disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            className="w-full h-14 bg-gradient-to-r from-[rgb(30,255,195)] to-[rgb(178,255,238)] hover:from-[rgb(178,255,238)] hover:to-[rgb(30,255,195)] text-slate-900 font-bold text-lg rounded-xl shadow-lg shadow-[rgb(30,255,195)]/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {withdrawLoading 
              ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) 
              : (
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Withdraw {unwrapWETH && withdrawToken === 'WETH' ? 'ETH' : withdrawToken}
                </div>
              )
            }
          </Button>
        </CardContent>
      </Card>

      {/* Balance Display */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-600/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgb(30,255,195)]/20 rounded-full flex items-center justify-center">
              <Banknote className="w-5 h-5 text-[rgb(30,255,195)]" />
            </div>
            Your Balances
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            Your token balances and vault holdings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[rgb(30,255,195)]/30 border-t-[rgb(30,255,195)] rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-[rgb(30,255,195)] font-medium text-lg">Loading balances...</div>
            </div>
          ) : (
            <>
              {/* Vault Balances */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[rgb(30,255,195)]" />
                  ExecutorVault Holdings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/60 rounded-xl p-4 border border-slate-600/30 hover:border-[rgb(30,255,195)]/30 transition-all duration-200">
                    <div className="text-sm text-gray-300 mb-2 font-medium">WETH Balance</div>
                    <div className="text-white font-bold text-xl">
                      {formatTokenAmount(ethers.formatEther(balances.wethBalance), 'WETH', 4)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/60 rounded-xl p-4 border border-slate-600/30 hover:border-[rgb(30,255,195)]/30 transition-all duration-200">
                    <div className="text-sm text-gray-300 mb-2 font-medium">AOT Balance</div>
                    <div className="text-white font-bold text-xl">
                      {formatTokenAmount(ethers.formatEther(balances.aotBalance), 'AOT', 4)}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Wallet Balances */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Wallet2 className="w-4 h-4 text-[rgb(30,255,195)]" />
                  Wallet Balances
                </h4>
                <div className="space-y-3">
                  {userBalances.map((token) => (
                    <div key={token.symbol} className="flex justify-between items-center bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl p-4 border border-slate-600/30 hover:border-[rgb(30,255,195)]/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm font-semibold border-[rgb(30,255,195)]/50 text-[rgb(30,255,195)] bg-[rgb(30,255,195)]/10">
                          {token.symbol}
                        </Badge>
                      </div>
                      <div className="text-white font-bold text-lg">
                        {formatTokenAmount(ethers.formatEther(token.balance), token.symbol, 4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}