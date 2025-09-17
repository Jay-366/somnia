'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/utils';

interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  isNative?: boolean;
}

export function BalanceChecker() {
  const account = useActiveAccount();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const checkBalances = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      // Get provider for Sepolia
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.sepolia.org'
      );

      // Check ETH balance
      const ethBalance = await provider.getBalance(account.address);
      
      // ERC20 ABI for balance checking
      const erc20ABI = [
        'function balanceOf(address owner) external view returns (uint256)',
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)'
      ];

      // Check token balances
      const tokenBalances: TokenBalance[] = [
        {
          symbol: 'ETH',
          balance: ethers.formatEther(ethBalance),
          address: 'native',
          isNative: true
        }
      ];

      // Check WETH balance
      try {
        const wethContract = new ethers.Contract(CONTRACT_ADDRESSES.WETH, erc20ABI, provider);
        const wethBalance = await wethContract.balanceOf(account.address);
        tokenBalances.push({
          symbol: 'WETH',
          balance: ethers.formatEther(wethBalance),
          address: CONTRACT_ADDRESSES.WETH
        });
      } catch (error) {
        console.warn('Failed to get WETH balance:', error);
      }

      // Check AOT balance
      try {
        const aotContract = new ethers.Contract(CONTRACT_ADDRESSES.AOT_TOKEN, erc20ABI, provider);
        const aotBalance = await aotContract.balanceOf(account.address);
        tokenBalances.push({
          symbol: 'AOT',
          balance: ethers.formatEther(aotBalance),
          address: CONTRACT_ADDRESSES.AOT_TOKEN
        });
      } catch (error) {
        console.warn('Failed to get AOT balance:', error);
      }

      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error checking balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBalances();
  }, [account?.address]);

  if (!account) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <p className="text-yellow-800 text-center">
            Connect your wallet to check balances
          </p>
        </CardContent>
      </Card>
    );
  }

  const ethBalance = balances.find(b => b.isNative);
  const isLowOnEth = ethBalance && parseFloat(ethBalance.balance) < 0.01;

  return (
    <Card className={`${isLowOnEth ? 'bg-red-50 border-red-200' : 'bg-slate-800/50 border-slate-600'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isLowOnEth ? 'text-red-800' : 'text-white'}`}>
          💰 Wallet Balances
          {isLowOnEth && <Badge variant="destructive">Low ETH!</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading balances...</div>
          </div>
        ) : (
          <>
            {balances.map((token) => (
              <div
                key={token.address}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  token.isNative
                    ? parseFloat(token.balance) < 0.01
                      ? 'bg-red-100 border border-red-300'
                      : 'bg-green-100 border border-green-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <div>
                  <div className={`font-medium ${
                    token.isNative && parseFloat(token.balance) < 0.01
                      ? 'text-red-800'
                      : 'text-gray-800'
                  }`}>
                    {token.symbol}
                  </div>
                  {!token.isNative && (
                    <div className="text-xs text-gray-500">
                      {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                    </div>
                  )}
                </div>
                <div className={`text-right font-bold ${
                  token.isNative && parseFloat(token.balance) < 0.01
                    ? 'text-red-800'
                    : 'text-gray-800'
                }`}>
                  {formatTokenAmount(token.balance, token.symbol)}
                  {token.isNative && parseFloat(token.balance) < 0.01 && (
                    <div className="text-xs text-red-600 font-normal">
                      Need more for gas!
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLowOnEth && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 mt-4">
                <div className="text-red-800 font-medium text-sm">⚠️ Low ETH Balance</div>
                <div className="text-red-700 text-xs mt-1">
                  You need more ETH to pay for transaction gas fees. Get ETH from:
                </div>
                <div className="mt-2 space-y-1">
                  <a
                    href="https://sepoliafaucet.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    • Sepolia Faucet (Free ETH)
                  </a>
                  <a
                    href="https://faucets.chain.link/sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    • Chainlink Faucet
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        <Button
          onClick={checkBalances}
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full mt-4"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Balances'}
        </Button>
      </CardContent>
    </Card>
  );
}