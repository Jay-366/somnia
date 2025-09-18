import Link from "next/link";
import Nav from "@/components/Nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ArbitragePage() {
  const strategies = [
    {
      id: 1,
      title: "DEX Pool vs Oracle Arbitrage",
      description: "Monitor DEX pool prices against Pyth Oracle feeds to identify arbitrage opportunities",
      example: {
        poolInfo: "AOT/WETH Pool: 1 AOT = $0.95",
        oraclePrice: "WETH/USD = $2000 (Pyth)",
        derivedPrice: "Derived AOT/USD = $1.00",
        opportunity: "+5.26% arbitrage potential"
      }
    },
    {
      id: 2,
      title: "USDC Pool vs Oracle Arbitrage",
      description: "Monitor USDC/WETH pool prices against Pyth Oracle feeds for stablecoin arbitrage",
      example: {
        poolInfo: "USDC/WETH Pool: 1 USDC = $0.998",
        oraclePrice: "USDC/USD = $1.000 (Pyth)",
        derivedPrice: "WETH/USD = $2000 (Pyth)",
        opportunity: "+0.2% arbitrage potential"
      }
    },
    {
      id: 3,
      title: "WBTC Pool vs Oracle Arbitrage",
      description: "Track WBTC/ETH pool pricing against Bitcoin Oracle feeds for BTC arbitrage",
      example: {
        poolInfo: "WBTC/ETH Pool: 1 WBTC = $42,150",
        oraclePrice: "BTC/USD = $42,500 (Pyth)",
        derivedPrice: "ETH/USD = $2000 (Pyth)",
        opportunity: "+0.83% arbitrage potential"
      }
    },
    {
      id: 4,
      title: "LINK Pool vs Oracle Arbitrage",
      description: "Compare LINK/USDC pool rates with Chainlink's own Oracle price feeds",
      example: {
        poolInfo: "LINK/USDC Pool: 1 LINK = $14.85",
        oraclePrice: "LINK/USD = $15.00 (Pyth)",
        derivedPrice: "USDC/USD = $1.000 (Pyth)",
        opportunity: "+1.01% arbitrage potential"
      }
    },
    {
      id: 5,
      title: "UNI Pool vs Oracle Arbitrage",
      description: "Monitor UNI/WETH pool against Uniswap token Oracle pricing for governance token arbitrage",
      example: {
        poolInfo: "UNI/WETH Pool: 1 UNI = $6.75",
        oraclePrice: "UNI/USD = $7.20 (Pyth)",
        derivedPrice: "WETH/USD = $2000 (Pyth)",
        opportunity: "+6.67% arbitrage potential"
      }
    },
    {
      id: 6,
      title: "MATIC Pool vs Oracle Arbitrage",
      description: "Track MATIC/USDT pool pricing against Polygon Oracle feeds for L2 token arbitrage",
      example: {
        poolInfo: "MATIC/USDT Pool: 1 MATIC = $0.815",
        oraclePrice: "MATIC/USD = $0.825 (Pyth)",
        derivedPrice: "USDT/USD = $0.999 (Pyth)",
        opportunity: "+1.22% arbitrage potential"
      }
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getProfitColor = (profit: string) => {
    switch (profit.toLowerCase()) {
      case "low": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-blue-100 text-blue-800 border-blue-200";
      case "high": return "bg-purple-100 text-purple-800 border-purple-200";
      case "very high": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Nav />

      {/* Header Section */}
      <div className="px-8 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl mt-20 font-bold text-white mb-6">
            Arbitrage <span className="text-[rgb(30,255,195)]">Strategies</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Discover and execute profitable arbitrage opportunities across different markets, 
            exchanges, and blockchain networks with our comprehensive strategy suite.
          </p>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="bg-slate-800/50 border-slate-700 backdrop-blur hover:bg-slate-800/70 transition-all group cursor-pointer">
                <CardHeader className="pb-4">
                  {/* Removed decorative diamond icon for cleaner professional look */}
                  <div className="mb-2" />
                  
                  <CardTitle className="text-white text-xl group-hover:text-[rgb(178,255,238)] transition-colors">
                    {strategy.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm leading-relaxed">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Example */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-xs text-gray-500 mb-2">Live Example</div>
                    <div className="space-y-2 text-sm">
                      {Object.entries(strategy.example).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-white font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/strategy-detail?id=${strategy.id}`}>
                    <Button 
                      className="w-full bg-[rgb(30,255,195)]/10 hover:bg-[rgb(30,255,195)]/20 text-[rgb(178,255,238)] border border-[rgb(30,255,195)]/30 hover:border-[rgb(30,255,195)]/50 transition-all"
                      variant="outline"
                    >
                      Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA
      <div className="border-t border-slate-700 bg-slate-900/30 px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Start Your Arbitrage Journey?</h3>
          <p className="text-lg text-gray-300 mb-6">
            Join thousands of traders already profiting from market inefficiencies
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-8 py-3 rounded-full font-semibold">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/pyth">
              <Button variant="outline" className="border-[rgb(178,255,238)] text-[rgb(178,255,238)] hover:bg-[rgb(178,255,238)] hover:text-slate-900 px-8 py-3 rounded-full font-semibold">
                View Live Feeds
              </Button>
            </Link>
          </div>
        </div>
      </div> */}
    </div>
  );
}
