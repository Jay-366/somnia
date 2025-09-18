'use client';

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Nav from "@/components/Nav";
import LightRays from "@/components/LightRays";
import InfiniteScroll from "@/components/InfiniteScroll";
import { FeatureSteps } from "@/components/blocks/feature-section";

export default function Home() {
  return (
  <div className="min-h-screen bg-black pt-24">
      {/* Navigation */}
      <Nav />

      {/* Hero Section */}
      <div className="relative -top-23 px-8 py-20 overflow-hidden">
        {/* Light Rays Background Effect */}
        <div className="absolute inset-x-0 bottom-0 -top-7 z-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#00ffcc"
            raysSpeed={1}
            lightSpread={1}
            rayLength={2.5}
            pulsating={false}
            fadeDistance={2}
            saturation={1}
            followMouse={false}
            mouseInfluence={0.5}
            noiseAmount={0.0}
            distortion={0.0}
            className="opacity-80"
          />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-20">
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
            
            <div className="flex justify-center lg:justify-center relative lg:-ml-24 xl:-ml-32">
              <InfiniteScroll
                className="w-[20rem] md:w-[200rem]"
                items={[
                  { content: <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Image src="/token-pair/eth_usdc.png" alt="ETH/USDC" width={32} height={32} className='rounded-md object-contain shadow-[0_0_8px_rgba(30,255,195,0.25)]' />
                        <span className='text-white font-medium'>ETH/USDC</span>
                      </div>
                      <span className='text-xs text-gray-400'>Pool 2641.88 | Oracle 2644.12</span>
                      <span className='text-emerald-400 text-sm font-semibold'>+$2.24</span>
                    </div> },
                  { content: <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Image src="/token-pair/bct_weth.png" alt="BTC/WETH" width={32} height={32} className='rounded-md object-contain shadow-[0_0_8px_rgba(30,255,195,0.25)]' />
                        <span className='text-white font-medium'>BTC/WETH</span>
                      </div>
                      <span className='text-xs text-gray-400'>Pool 67234.11 | Oracle 67228.45</span>
                      <span className='text-red-400 text-sm font-semibold'>-$5.66</span>
                    </div> },
                  { content: <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Image src="/token-pair/arb-usdc.png" alt="ARB/USDC" width={32} height={32} className='rounded-md object-contain shadow-[0_0_8px_rgba(30,255,195,0.25)]' />
                        <span className='text-white font-medium'>ARB/USDC</span>
                      </div>
                      <span className='text-xs text-gray-400'>Pool 1.22 | Oracle 1.24</span>
                      <span className='text-emerald-400 text-sm font-semibold'>+$0.02</span>
                    </div> },
                  { content: <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Image src="/token-pair/sol_usdc.png" alt="SOL/USDC" width={32} height={32} className='rounded-md object-contain shadow-[0_0_8px_rgba(30,255,195,0.25)]' />
                        <span className='text-white font-medium'>SOL/USDC</span>
                      </div>
                      <span className='text-xs text-gray-400'>Pool 142.12 | Oracle 142.40</span>
                      <span className='text-emerald-400 text-sm font-semibold'>+$0.28</span>
                    </div> },
                  { content: <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Image src="/token-pair/link_eth.png" alt="LINK/ETH" width={32} height={32} className='rounded-md object-contain shadow-[0_0_8px_rgba(30,255,195,0.25)]' />
                        <span className='text-white font-medium'>LINK/ETH</span>
                      </div>
                      <span className='text-xs text-gray-400'>Pool 0.00521 | Oracle 0.00525</span>
                      <span className='text-emerald-400 text-sm font-semibold'>+$0.00004</span>
                    </div> },
                  { content: <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Image src="/token-pair/somi_eth.png" alt="SOMI/ETH" width={32} height={32} className='rounded-md object-contain shadow-[0_0_8px_rgba(30,255,195,0.25)]' />
                        <span className='text-white font-medium'>SOMI/ETH</span>
                      </div>
                      <span className='text-xs text-gray-400'>Pool 0.00082 | Oracle 0.00083</span>
                      <span className='text-emerald-400 text-sm font-semibold'>+$0.00001</span>
                    </div> },
                  
                ]}
                isTilted={true}
                tiltDirection='right'
                autoplay={true}
                autoplaySpeed={0.12}
                autoplayDirection='down'
                pauseOnHover={true}
              />
            </div>
          </div>
        </div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-[rgb(178,255,238)]/20 rounded-full animate-pulse z-10"></div>
        <div className="absolute bottom-40 left-10 w-16 h-16 bg-[rgb(178,255,238)]/10 rounded-lg rotate-45 z-10"></div>
      </div>

      {/* Features Section */}
      <div className="bg-black">
        <FeatureSteps 
          features={[
            { 
              step: 'Step 1', 
              title: 'Connect Your Wallet',
              content: 'Start by connecting your Web3 wallet to access real-time arbitrage opportunities across DEX pools.', 
              image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2070&auto=format&fit=crop' 
            },
            { 
              step: 'Step 2',
              title: 'Analyze Price Differences',
              content: 'Our advanced algorithms scan multiple DEX pools and oracle feeds to identify profitable arbitrage opportunities.',
              image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop'
            },
            { 
              step: 'Step 3',
              title: 'Execute Trades',
              content: 'Execute profitable trades automatically with our optimized smart contracts, maximizing your returns while minimizing gas fees.',
              image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2070&auto=format&fit=crop'
            },
          ]}
          title="How Arbitrage Trading Works"
          autoPlayInterval={4000}
          imageHeight="h-[500px]"
          className="text-white"
        />
      </div>

      {/* CTA Section
      <div className="px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to Start Arbitrage Trading?</h3>
          <p className="text-xl text-gray-300 mb-8">
            Execute profitable trades by identifying price differences between DEX pools and oracle feeds
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-8 py-3 rounded-full font-semibold text-lg">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/arbitrage">
              <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-8 py-3 rounded-full font-semibold text-lg">
                View Strategies
              </Button>
            </Link>
            <Link href="/pyth">
              <Button variant="outline" className="border-[rgb(178,255,238)] text-[rgb(178,255,238)] hover:bg-[rgb(178,255,238)] hover:text-slate-900 px-8 py-3 rounded-full font-semibold text-lg">
                View Oracle Feeds
              </Button>
            </Link>
          </div>
        </div>
      </div> */}

      {/* Market Ticker
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
      </div> */}
    </div>
  );
}
