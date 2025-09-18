'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import Nav from '@/components/Nav';
import { WithdrawalPanel } from '@/components/WithdrawalPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SwapHistoryService, SwapHistoryEntry } from '@/lib/swap-history';
import { getNetworkById } from '@/lib/networks';
import { formatDistanceToNow } from '@/lib/utils';
import { ExternalLink, RefreshCw, TrendingUp, TrendingDown, Clock, Hash, Wallet, History } from 'lucide-react';

type ActiveTab = 'withdrawal' | 'history';

export default function DashboardPage() {
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState<ActiveTab>('withdrawal');
  const [swapHistory, setSwapHistory] = useState<SwapHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSwapHistory = async () => {
    if (!account?.address) {
      setSwapHistory([]);
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const historyService = new SwapHistoryService();
      const history = await historyService.getUserSwapHistory(account.address);
      setSwapHistory(history);
    } catch (error) {
      console.error('Error loading swap history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSwapHistory();
    
    // Listen for swap history updates
    const handleHistoryUpdate = (event: CustomEvent) => {
      if (event.detail.userAddress === account?.address) {
  console.log('Dashboard refreshing swap history due to new swap');
        loadSwapHistory();
      }
    };

    window.addEventListener('swapHistoryUpdated', handleHistoryUpdate as EventListener);
    
    return () => {
      window.removeEventListener('swapHistoryUpdated', handleHistoryUpdate as EventListener);
    };
  }, [account?.address]);

  const getExplorerUrl = (chainId: number, txHash: string) => {
    const network = getNetworkById(chainId);
    return network ? `${network.blockExplorer}/tx/${txHash}` : '#';
  };

  const formatTokenAmount = (amount: string, symbol: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.0001) return `< 0.0001 ${symbol}`;
    return `${num.toFixed(4)} ${symbol}`;
  };

  const getSwapTypeIcon = (fromToken: string, toToken: string) => {
    if (fromToken === 'AOT' && toToken === 'WETH') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (fromToken === 'WETH' && toToken === 'AOT') {
      return <TrendingDown className="w-4 h-4 text-blue-500" />;
    }
    return <RefreshCw className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Unknown</Badge>;
    }
  };

  const totalSwaps = swapHistory.length;
  const successfulSwaps = swapHistory.filter(swap => swap.status === 'success').length;
  const totalVolumeWETH = swapHistory
    .filter(swap => swap.status === 'success')
    .reduce((total, swap) => {
      if (swap.fromToken === 'WETH') {
        return total + parseFloat(swap.fromAmount);
      } else if (swap.toToken === 'WETH') {
        return total + parseFloat(swap.toAmount);
      }
      return total;
    }, 0);

  if (!account) {
    return (
      <div className="min-h-screen bg-black">
        <Nav />
        <div className="px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-6">Trading Dashboard</h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to view your swap history and trading statistics
            </p>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
              <p className="text-gray-400">Please connect your wallet to access the dashboard</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Nav />
      
      <div className="flex mt-20">
        {/* Left Sidebar - Sticky positioned to stay connected */}
        <div className="w-64 bg-black border-r border-slate-700 flex flex-col sticky top-0 h-screen">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-gray-400 mt-1">Choose your action</p>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-3">
              <button
                onClick={() => setActiveTab('withdrawal')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  activeTab === 'withdrawal'
                    ? 'bg-[rgb(30,255,195)] text-slate-900 font-semibold shadow-lg'
                    : 'text-gray-300 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <Wallet size={18} />
                <span>Withdrawal</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  activeTab === 'history'
                    ? 'bg-[rgb(30,255,195)] text-slate-900 font-semibold shadow-lg'
                    : 'text-gray-300 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <History size={18} />
                <span>History</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-gray-500 text-center">
              Trading Dashboard v1.0
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-screen">
          {/* Header */}
          <div className="p-8 border-b border-slate-700/50 bg-black sticky top-0 z-10">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
              Trading <span className="text-[rgb(30,255,195)]">
                {activeTab === 'withdrawal' ? 'Fund Management' : 'History'}
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              {activeTab === 'withdrawal' 
                ? 'Manage your vault balances and withdraw tokens'
                : 'Monitor your arbitrage trading performance'
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'withdrawal' && <WithdrawalPanel />}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-black border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[rgb(30,255,195)]" />
                        Total Swaps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">{totalSwaps}</div>
                      <p className="text-sm text-gray-400">{successfulSwaps} successful</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Success Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {totalSwaps > 0 ? Math.round((successfulSwaps / totalSwaps) * 100) : 0}%
                      </div>
                      <p className="text-sm text-gray-400">of all transactions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Hash className="w-5 h-5 text-blue-400" />
                        Volume (WETH)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {totalVolumeWETH.toFixed(4)}
                      </div>
                      <p className="text-sm text-gray-400">total traded</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Swap History */}
                <Card className="bg-black border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <History size={20} />
                          Swap History
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Your recent arbitrage transactions
                        </CardDescription>
                      </div>
                      <Button
                        onClick={loadSwapHistory}
                        disabled={refreshing}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 hover:border-[rgb(30,255,195)]"
                      >
                        {refreshing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 text-[rgb(30,255,195)] animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading swap history...</p>
                      </div>
                    ) : swapHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">No swaps found</p>
                        <p className="text-gray-500 text-sm">
                          Start trading to see your transaction history here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {swapHistory.map((swap) => {
                          const network = getNetworkById(swap.chainId);
                          
                          return (
                            <div
                              key={swap.txHash}
                              className="bg-slate-900/30 rounded-lg p-4 border border-slate-600/50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {getSwapTypeIcon(swap.fromToken, swap.toToken)}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-white font-medium">
                                        {formatTokenAmount(swap.fromAmount, swap.fromToken)} →{' '}
                                        {formatTokenAmount(swap.toAmount, swap.toToken)}
                                      </span>
                                      {getStatusBadge(swap.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(swap.timestamp))} ago
                                      </span>
                                      {network && (
                                        <span className="flex items-center gap-1">
                                          <span>{network.icon}</span>
                                          {network.displayName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <a
                                    href={getExplorerUrl(swap.chainId, swap.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600/50 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Explorer
                                  </a>
                                </div>
                              </div>
                              
                              {swap.gasUsed && (
                                <div className="mt-3 pt-3 border-t border-slate-600/50">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Gas Used: {swap.gasUsed.toLocaleString()}</span>
                                    <span className="font-mono">{swap.txHash.slice(0, 10)}...{swap.txHash.slice(-8)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}