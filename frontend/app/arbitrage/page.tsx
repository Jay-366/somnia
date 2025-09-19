import Link from "next/link";
import Nav from "@/components/Nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import strategiesData from "@/data/strategies.json";

export default function ArbitragePage() {
  const strategies = strategiesData.strategies;

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
                  {/* Strategy Info */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-xs text-gray-500 mb-3">Strategy Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit Margin:</span>
                        <span className="text-green-400 font-medium">{strategy.profitMargin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <Badge 
                          className="text-xs px-2 py-1 bg-[rgb(30,255,195)] text-black border-[rgb(30,255,195)]"
                          variant="outline"
                        >
                          {strategy.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Min Investment:</span>
                        <span className="text-white font-medium">{strategy.minInvestment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expected Return:</span>
                        <span className="text-[rgb(30,255,195)] font-medium">{strategy.expectedReturn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time Frame:</span>
                        <span className="text-white font-medium">{strategy.timeFrame}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network:</span>
                        <span className="text-blue-400 font-medium">{strategy.network}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <Badge 
                          className="text-xs px-2 py-1 bg-[rgb(30,255,195)] text-black border-[rgb(30,255,195)]"
                          variant="outline"
                        >
                          {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/strategy-detail?id=${strategy.id}`}>
                    <Button 
                      className="w-full bg-[rgb(30,255,195)]/10 hover:bg-[rgb(30,255,195)]/20 text-[rgb(178,255,238)] border border-[rgb(30,255,195)]/30 hover:border-[rgb(30,255,195)]/50 transition-all"
                      variant="outline"
                    >
                      View Details & Execute
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
