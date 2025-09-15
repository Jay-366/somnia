'use client';

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation */}
      <Nav />

      {/* Hero Section */}
      <div className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                DEXPOOL VS ORACLE.
                <br />
                <span className="text-[rgb(30,255,195)]">ARBITRAGE</span>
                <br />
                SOLUTIONS.
              </h1>
              
              <p className="text-xl text-gray-300 max-w-lg">
                Analytics, trading scenarios, investing, arbitrage psychology.
              </p>
              
              <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-8 py-3 rounded-full font-semibold text-lg transition-all transform hover:scale-105">
                EXPLORE NOW →
              </Button>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    Arbitrage Opportunities
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Real-time price differences between DEX pools and oracles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">WETH/AOT</div>
                      <div className="text-sm text-gray-400">Pool: $1,847.23 | Oracle: $1,852.14</div>
                    </div>
                    <div className="text-green-400 font-bold">+$4.91</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">ETH/USDC</div>
                      <div className="text-sm text-gray-400">Pool: $2,641.88 | Oracle: $2,644.12</div>
                    </div>
                    <div className="text-green-400 font-bold">+$2.24</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">BTC/WETH</div>
                      <div className="text-sm text-gray-400">Pool: $67,234.11 | Oracle: $67,228.45</div>
                    </div>
                    <div className="text-red-400 font-bold">-$5.66</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-[rgb(178,255,238)]/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 left-10 w-16 h-16 bg-[rgb(178,255,238)]/10 rounded-lg rotate-45"></div>
      </div>

      {/* Features Section */}
      <div className="px-8 py-20 bg-[rgb(255,246,233)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">User Interface – Arbitrage Display</h2>
            <p className="text-xl text-slate-600">Comprehensive dashboard for arbitrage opportunities</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 border-slate-200 backdrop-blur hover:bg-white/90 transition-all shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-blue-400 rounded"></div>
                </div>
                <CardTitle className="text-slate-900">Token Pairs Dashboard</CardTitle>
                <CardDescription className="text-slate-600">
                  Monitor WETH/AOT and other token pairs in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-700">
                  <li>• Live pool price tracking</li>
                  <li>• Oracle price comparison</li>
                  <li>• Historical price data</li>
                  <li>• Volume indicators</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 border-slate-200 backdrop-blur hover:bg-white/90 transition-all shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                </div>
                <CardTitle className="text-slate-900">Profit Estimation</CardTitle>
                <CardDescription className="text-slate-600">
                  Calculate estimated arbitrage profits automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-700">
                  <li>• Real-time profit calculations</li>
                  <li>• Gas fee considerations</li>
                  <li>• Slippage estimates</li>
                  <li>• Risk assessment</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 border-slate-200 backdrop-blur hover:bg-white/90 transition-all shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-[rgb(30,255,195)]/20 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-[rgb(30,255,195)] rounded-lg rotate-45"></div>
                </div>
                <CardTitle className="text-slate-900">Trade Flow Visualization</CardTitle>
                <CardDescription className="text-slate-600">
                  Step-by-step trade execution with ReactFlow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-700">
                  <li>• Interactive flow diagrams</li>
                  <li>• Token amounts breakdown</li>
                  <li>• Pool interaction details</li>
                  <li>• Fee structure analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to Start Arbitrage Trading?</h3>
          <p className="text-xl text-gray-300 mb-8">
            Execute profitable trades by identifying price differences between DEX pools and oracle feeds
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/arbitrage">
              <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-8 py-3 rounded-full font-semibold text-lg">
                View Strategies
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-8 py-3 rounded-full font-semibold text-lg">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/pyth">
              <Button variant="outline" className="border-[rgb(178,255,238)] text-[rgb(178,255,238)] hover:bg-[rgb(178,255,238)] hover:text-slate-900 px-8 py-3 rounded-full font-semibold text-lg">
                View Oracle Feeds
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Market Ticker */}
      <div className="border-t border-slate-700 bg-slate-900/50 px-8 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-8 text-gray-300">
            <span className="text-red-400">DJI 34,123.45 -24.3 (-0.57%)</span>
            <span className="text-blue-400">S&P 500 4,456.78 -75.0 (-0.51%)</span>
            <span className="text-blue-400">EUR/USD 1.05818 -0.00010 (-0.01%)</span>
            <span className="text-orange-400">Bitcoin 29554 +821 (+2.86%)</span>
            <span className="text-gray-400">Ethereum 1607.4 -39.7 (+2.53%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
