import dotenv from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import DiaPriceFetcher, { DiaPrice } from '../price/dia';
import UniswapSubgraphFetcher, { UniswapPriceData } from '../price/uniswapSubgraph';

dotenv.config();

export interface NormalizedPrice {
  symbol: string;
  price: number;
  timestamp: string;
  source: string;
  confidence: number; // 0-1, based on volume/liquidity
}

export interface ArbitrageOpportunity {
  baseToken: string;
  quoteToken: string;
  buySource: string;
  sellSource: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  profitEstimate: number;
  confidence: number;
  timestamp: string;
}

export interface StrategyConfig {
  minSpreadPercentage: number;
  minConfidence: number;
  priceDeviationThreshold: number;
  maxPriceAge: number; // seconds
}

export interface ArbitrageDataFile {
  lastUpdated: string;
  analysisConfig: {
    minSpreadPercentage: number;
    minConfidence: number;
    maxPriceAge: number;
  };
  priceData: {
    dia: NormalizedPrice[];
    uniswap: NormalizedPrice[];
  };
  opportunities: ArbitrageOpportunity[];
  summary: {
    totalOpportunities: number;
    bestSpread: number;
    averageSpread: number;
    totalEstimatedProfit: number;
  };
  metadata: {
    analysisTime: string;
    tokensAnalyzed: string[];
    sourcesUsed: string[];
    version: string;
  };
}

class StrategyEngine {
  private diaFetcher: DiaPriceFetcher;
  private uniswapFetcher: UniswapSubgraphFetcher;
  private config: StrategyConfig;
  private outputFile: string;

  constructor() {
    this.diaFetcher = new DiaPriceFetcher();
    this.uniswapFetcher = new UniswapSubgraphFetcher();
    this.outputFile = process.env.OUTPUT_FILE || './public/arbData.json';
    
    this.config = {
      minSpreadPercentage: parseFloat(process.env.PRICE_DEVIATION_THRESHOLD || '0.02'),
      minConfidence: 0.7,
      priceDeviationThreshold: parseFloat(process.env.PRICE_DEVIATION_THRESHOLD || '0.02'),
      maxPriceAge: 300 // 5 minutes
    };
  }

  async fetchAllPrices(tokens: string[]): Promise<{ dia: NormalizedPrice[], uniswap: NormalizedPrice[] }> {
    console.log('🔍 Fetching prices from all sources...');
    
    // Fetch DIA prices
    const diaPromises = tokens.map(async (token) => {
      const price = await this.diaFetcher.fetchPrice(token);
      if (price) {
        return this.normalizeDiaPrice(price);
      }
      return null;
    });

    // Fetch Uniswap prices (assuming pairs with USDC)
    const uniswapPromises = tokens.map(async (token) => {
      if (token === 'USDC') return null;
      
      const poolData = await this.uniswapFetcher.findPoolByTokens(token, 'USDC');
      if (poolData) {
        const priceData = await this.uniswapFetcher.fetchPoolData(
          poolData.token0.id, 
          poolData.token1.id, 
          parseInt(poolData.feeTier)
        );
        if (priceData) {
          return this.normalizeUniswapPrice(priceData, token);
        }
      }
      return null;
    });

    const [diaResults, uniswapResults] = await Promise.all([
      Promise.all(diaPromises),
      Promise.all(uniswapPromises)
    ]);

    return {
      dia: diaResults.filter(p => p !== null) as NormalizedPrice[],
      uniswap: uniswapResults.filter(p => p !== null) as NormalizedPrice[]
    };
  }

  private normalizeDiaPrice(diaPrice: DiaPrice): NormalizedPrice {
    return {
      symbol: diaPrice.symbol,
      price: diaPrice.price,
      timestamp: diaPrice.timestamp,
      source: 'DIA',
      confidence: 0.8 // DIA generally has good data quality
    };
  }

  private normalizeUniswapPrice(uniswapData: UniswapPriceData, targetToken: string): NormalizedPrice {
    const { pool } = uniswapData;
    
    // Determine which token is our target and get its price in USDC
    let price: number;
    let symbol: string;
    
    if (pool.token0.symbol.toUpperCase() === targetToken.toUpperCase()) {
      price = uniswapData.token0Price;
      symbol = pool.token0.symbol;
    } else if (pool.token1.symbol.toUpperCase() === targetToken.toUpperCase()) {
      price = uniswapData.token1Price;
      symbol = pool.token1.symbol;
    } else {
      // If neither token matches, use token0 price
      price = uniswapData.token0Price;
      symbol = pool.token0.symbol;
    }

    // Calculate confidence based on TVL and volume
    const tvl = parseFloat(pool.totalValueLockedUSD);
    const volume = parseFloat(pool.volumeUSD);
    const confidence = this.calculateUniswapConfidence(tvl, volume);

    return {
      symbol,
      price,
      timestamp: uniswapData.timestamp,
      source: 'Uniswap-V3',
      confidence
    };
  }

  private calculateUniswapConfidence(tvl: number, volume: number): number {
    // Higher TVL and volume = higher confidence
    let confidence = 0.5;
    
    if (tvl > 10000000) confidence += 0.2; // $10M+ TVL
    if (tvl > 1000000) confidence += 0.1;  // $1M+ TVL
    
    if (volume > 1000000) confidence += 0.15; // $1M+ daily volume
    if (volume > 100000) confidence += 0.05;  // $100k+ daily volume
    
    return Math.min(confidence, 1.0);
  }

  findArbitrageOpportunities(diaPrices: NormalizedPrice[], uniswapPrices: NormalizedPrice[]): ArbitrageOpportunity[] {
    console.log('🎯 Analyzing arbitrage opportunities...');
    
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Compare prices for common tokens
    for (const diaPrice of diaPrices) {
      const uniswapPrice = uniswapPrices.find(up => 
        up.symbol.toUpperCase() === diaPrice.symbol.toUpperCase()
      );
      
      if (!uniswapPrice) continue;
      
      // Check if prices are recent enough
      if (!this.isPriceRecent(diaPrice.timestamp) || !this.isPriceRecent(uniswapPrice.timestamp)) {
        continue;
      }
      
      // Calculate spread
      const spread = Math.abs(diaPrice.price - uniswapPrice.price);
      const avgPrice = (diaPrice.price + uniswapPrice.price) / 2;
      const spreadPercentage = (spread / avgPrice) * 100;
      
      // Check if spread meets minimum threshold
      if (spreadPercentage < this.config.minSpreadPercentage * 100) {
        continue;
      }
      
      // Determine buy/sell sources
      const buySource = diaPrice.price < uniswapPrice.price ? 'DIA' : 'Uniswap-V3';
      const sellSource = diaPrice.price < uniswapPrice.price ? 'Uniswap-V3' : 'DIA';
      const buyPrice = Math.min(diaPrice.price, uniswapPrice.price);
      const sellPrice = Math.max(diaPrice.price, uniswapPrice.price);
      
      // Calculate confidence (weighted average)
      const confidence = (diaPrice.confidence + uniswapPrice.confidence) / 2;
      
      // Skip low confidence opportunities
      if (confidence < this.config.minConfidence) {
        continue;
      }
      
      // Estimate profit (simplified, doesn't account for gas/fees)
      const profitEstimate = (spreadPercentage / 100) * 1000; // Assuming $1000 trade size
      
      const opportunity: ArbitrageOpportunity = {
        baseToken: diaPrice.symbol,
        quoteToken: 'USDC',
        buySource,
        sellSource,
        buyPrice,
        sellPrice,
        spread,
        spreadPercentage,
        profitEstimate,
        confidence,
        timestamp: new Date().toISOString()
      };
      
      opportunities.push(opportunity);
    }
    
    // Sort by profit estimate descending
    return opportunities.sort((a, b) => b.profitEstimate - a.profitEstimate);
  }

  private isPriceRecent(timestamp: string): boolean {
    const priceTime = new Date(timestamp).getTime();
    const now = Date.now();
    const ageSeconds = (now - priceTime) / 1000;
    
    return ageSeconds <= this.config.maxPriceAge;
  }

  calculateImpliedPrice(basePrice: number, targetSpread: number): number {
    return basePrice * (1 + targetSpread);
  }

  private calculateSummary(opportunities: ArbitrageOpportunity[]) {
    if (opportunities.length === 0) {
      return {
        totalOpportunities: 0,
        bestSpread: 0,
        averageSpread: 0,
        totalEstimatedProfit: 0
      };
    }

    const spreads = opportunities.map(opp => opp.spreadPercentage);
    const profits = opportunities.map(opp => opp.profitEstimate);

    return {
      totalOpportunities: opportunities.length,
      bestSpread: Math.max(...spreads),
      averageSpread: spreads.reduce((sum, spread) => sum + spread, 0) / spreads.length,
      totalEstimatedProfit: profits.reduce((sum, profit) => sum + profit, 0)
    };
  }

  saveArbitrageData(
    diaPrices: NormalizedPrice[], 
    uniswapPrices: NormalizedPrice[], 
    opportunities: ArbitrageOpportunity[], 
    tokensAnalyzed: string[]
  ): void {
    try {
      const timestamp = new Date().toISOString();
      const summary = this.calculateSummary(opportunities);

      const data: ArbitrageDataFile = {
        lastUpdated: timestamp,
        analysisConfig: {
          minSpreadPercentage: this.config.minSpreadPercentage * 100,
          minConfidence: this.config.minConfidence,
          maxPriceAge: this.config.maxPriceAge
        },
        priceData: {
          dia: diaPrices,
          uniswap: uniswapPrices
        },
        opportunities: opportunities,
        summary: summary,
        metadata: {
          analysisTime: timestamp,
          tokensAnalyzed: tokensAnalyzed,
          sourcesUsed: ['DIA', 'Uniswap-V3'],
          version: '1.0.0'
        }
      };

      // Ensure directory exists
      mkdirSync(dirname(this.outputFile), { recursive: true });

      // Write to JSON file
      writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
      
      console.log(`💾 Arbitrage data saved to: ${this.outputFile}`);
      console.log(`📊 Summary: ${opportunities.length} opportunities, best spread: ${summary.bestSpread.toFixed(2)}%`);

    } catch (error) {
      console.error('❌ Error saving arbitrage data:', error);
    }
  }

  async analyzeMarket(tokens: string[] = ['ETH', 'WBTC', 'LINK']): Promise<ArbitrageOpportunity[]> {
    console.log('🚀 Starting market analysis...');
    console.log(`Analyzing tokens: ${tokens.join(', ')}\n`);
    
    try {
      // Fetch all prices
      const { dia, uniswap } = await this.fetchAllPrices(tokens);
      
      console.log(`\n📊 Price Summary:`);
      console.log(`DIA prices: ${dia.length}`);
      console.log(`Uniswap prices: ${uniswap.length}\n`);
      
      // Find opportunities
      const opportunities = this.findArbitrageOpportunities(dia, uniswap);
      
      console.log(`🎯 Found ${opportunities.length} arbitrage opportunities\n`);
      
      // Display opportunities
      if (opportunities.length > 0) {
        console.log('💰 Top Opportunities:');
        opportunities.slice(0, 5).forEach((opp, index) => {
          console.log(`${index + 1}. ${opp.baseToken}`);
          console.log(`   Buy: ${opp.buySource} @ $${opp.buyPrice.toFixed(4)}`);
          console.log(`   Sell: ${opp.sellSource} @ $${opp.sellPrice.toFixed(4)}`);
          console.log(`   Spread: ${opp.spreadPercentage.toFixed(2)}% ($${opp.spread.toFixed(4)})`);
          console.log(`   Estimated Profit: $${opp.profitEstimate.toFixed(2)}`);
          console.log(`   Confidence: ${(opp.confidence * 100).toFixed(1)}%\n`);
        });
      } else {
        console.log('❌ No profitable opportunities found at current thresholds');
        console.log(`   Min spread: ${this.config.minSpreadPercentage * 100}%`);
        console.log(`   Min confidence: ${this.config.minConfidence * 100}%`);
      }

      // Save data to JSON file
      this.saveArbitrageData(dia, uniswap, opportunities, tokens);
      
      return opportunities;
      
    } catch (error) {
      console.error('❌ Error during market analysis:', error);
      return [];
    }
  }
}

// CLI execution
async function main() {
  const strategy = new StrategyEngine();
  
  const tokens = process.argv.slice(2).length > 0 
    ? process.argv.slice(2) 
    : ['ETH', 'WBTC', 'LINK'];

  await strategy.analyzeMarket(tokens);
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default StrategyEngine;