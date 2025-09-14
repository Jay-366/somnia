import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ArbitragePage() {
  const strategies = [
    {
      id: 1,
      title: "DEX Pool vs Oracle Arbitrage",
      description: "🏦 Monitor DEX pool prices against Pyth Oracle feeds to identify arbitrage opportunities",
      profitPotential: "High",
      riskLevel: "Medium",
      complexity: "Intermediate",
      timeframe: "5-15 minutes",
      requirements: ["📊 Real-time Oracle access", "💧 Pool liquidity monitoring", "⚡ Fast execution"],
      example: {
        poolInfo: "AOT/WETH Pool: 1 AOT = $0.95",
        oraclePrice: "📊 WETH/USD = $2000 (Pyth)",
        derivedPrice: "Derived AOT/USD = $1.00",
        opportunity: "✅ +5.26% arbitrage potential"
      },
      status: "active"
    },
    {
      id: 2,
      title: "USDC Pool vs Oracle Arbitrage",
      description: "🏦 Monitor USDC/WETH pool prices against Pyth Oracle feeds for stablecoin arbitrage",
      profitPotential: "Medium",
      riskLevel: "Low",
      complexity: "Beginner",
      timeframe: "2-5 minutes",
      requirements: ["📊 USDC Oracle access", "💧 Stablecoin liquidity", "⚡ Fast execution"],
      example: {
        poolInfo: "USDC/WETH Pool: 1 USDC = $0.998",
        oraclePrice: "📊 USDC/USD = $1.000 (Pyth)",
        derivedPrice: "WETH/USD = $2000 (Pyth)",
        opportunity: "✅ +0.2% arbitrage potential"
      },
      status: "active"
    },
    {
      id: 3,
      title: "WBTC Pool vs Oracle Arbitrage",
      description: "🏦 Track WBTC/ETH pool pricing against Bitcoin Oracle feeds for BTC arbitrage",
      profitPotential: "High",
      riskLevel: "Medium",
      complexity: "Intermediate",
      timeframe: "5-15 minutes",
      requirements: ["📊 BTC Oracle access", "💧 WBTC liquidity monitoring", "⚡ Cross-asset execution"],
      example: {
        poolInfo: "WBTC/ETH Pool: 1 WBTC = $42,150",
        oraclePrice: "📊 BTC/USD = $42,500 (Pyth)",
        derivedPrice: "ETH/USD = $2000 (Pyth)",
        opportunity: "✅ +0.83% arbitrage potential"
      },
      status: "active"
    },
    {
      id: 4,
      title: "LINK Pool vs Oracle Arbitrage",
      description: "🏦 Compare LINK/USDC pool rates with Chainlink's own Oracle price feeds",
      profitPotential: "Medium",
      riskLevel: "Medium",
      complexity: "Intermediate",
      timeframe: "3-10 minutes",
      requirements: ["📊 LINK Oracle access", "💧 LINK pool monitoring", "⚡ Multi-pool execution"],
      example: {
        poolInfo: "LINK/USDC Pool: 1 LINK = $14.85",
        oraclePrice: "📊 LINK/USD = $15.00 (Pyth)",
        derivedPrice: "USDC/USD = $1.000 (Pyth)",
        opportunity: "✅ +1.01% arbitrage potential"
      },
      status: "active"
    },
    {
      id: 5,
      title: "UNI Pool vs Oracle Arbitrage",
      description: "🏦 Monitor UNI/WETH pool against Uniswap token Oracle pricing for governance token arbitrage",
      profitPotential: "High",
      riskLevel: "High",
      complexity: "Advanced",
      timeframe: "5-20 minutes",
      requirements: ["📊 UNI Oracle access", "💧 Governance token liquidity", "⚡ Volatility management"],
      example: {
        poolInfo: "UNI/WETH Pool: 1 UNI = $6.75",
        oraclePrice: "📊 UNI/USD = $7.20 (Pyth)",
        derivedPrice: "WETH/USD = $2000 (Pyth)",
        opportunity: "✅ +6.67% arbitrage potential"
      },
      status: "beta"
    },
    {
      id: 6,
      title: "MATIC Pool vs Oracle Arbitrage",
      description: "🏦 Track MATIC/USDT pool pricing against Polygon Oracle feeds for L2 token arbitrage",
      profitPotential: "Medium",
      riskLevel: "Low",
      complexity: "Beginner",
      timeframe: "3-8 minutes",
      requirements: ["📊 MATIC Oracle access", "💧 L2 token liquidity", "⚡ Cross-chain awareness"],
      example: {
        poolInfo: "MATIC/USDT Pool: 1 MATIC = $0.815",
        oraclePrice: "📊 MATIC/USD = $0.825 (Pyth)",
        derivedPrice: "USDT/USD = $0.999 (Pyth)",
        opportunity: "✅ +1.22% arbitrage potential"
      },
      status: "active"
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-[rgb(30,255,195)]/20 text-[rgb(30,255,195)] border-[rgb(30,255,195)]/30";
      case "beta": return "bg-amber-100 text-amber-800 border-amber-200";
      case "coming soon": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-700/50">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-[rgb(178,255,238)] to-[rgb(30,255,195)] rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg">AFS</span>
          </div>
          <span className="text-white text-sm font-medium">ANTI FRAGILE SYSTEM</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
          <Link href="/pyth" className="text-gray-300 hover:text-white transition-colors">Oracle Feeds</Link>
          <span className="text-[rgb(178,255,238)] font-medium">Arbitrage</span>
        </div>
      </nav>

      {/* Header Section */}
      <div className="px-8 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Arbitrage <span className="text-[rgb(30,255,195)]">Strategies</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Discover and execute profitable arbitrage opportunities across different markets, 
            exchanges, and blockchain networks with our comprehensive strategy suite.
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900 px-6 py-2 rounded-full font-semibold">
              Start Trading
            </Button>
            <Button variant="outline" className="border-[rgb(178,255,238)] text-[rgb(178,255,238)] hover:bg-[rgb(178,255,238)] hover:text-slate-900 px-6 py-2 rounded-full font-semibold">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="bg-slate-800/50 border-slate-700 backdrop-blur hover:bg-slate-800/70 transition-all group cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[rgb(30,255,195)]/20 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-[rgb(30,255,195)] rounded rotate-45"></div>
                    </div>
                    <Badge className={`${getStatusColor(strategy.status)} text-xs px-2 py-1`}>
                      {strategy.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-white text-xl group-hover:text-[rgb(178,255,238)] transition-colors">
                    {strategy.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm leading-relaxed">
                    {strategy.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Profit Potential</div>
                      <Badge className={`${getProfitColor(strategy.profitPotential)} text-xs px-2 py-1`}>
                        {strategy.profitPotential}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                      <Badge className={`${getRiskColor(strategy.riskLevel)} text-xs px-2 py-1`}>
                        {strategy.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Complexity</div>
                      <div className="text-white text-sm font-medium">{strategy.complexity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Timeframe</div>
                      <div className="text-white text-sm font-medium">{strategy.timeframe}</div>
                    </div>
                  </div>

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

                  {/* Requirements */}
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Requirements</div>
                    <ul className="space-y-1">
                      {strategy.requirements.map((req, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <div className="w-1 h-1 bg-[rgb(178,255,238)] rounded-full mr-2 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
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

      {/* Bottom CTA */}
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
      </div>
    </div>
  );
}
