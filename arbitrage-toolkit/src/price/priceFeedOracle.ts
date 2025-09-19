import axios from 'axios';
import dotenv from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

dotenv.config();

export interface TradingPair {
  baseToken: string;
  quoteToken: string;
  price: number;
  timestamp: string;
  source: string;
  success: boolean;
  error?: string;
}

export interface PriceFeedData {
  lastUpdated: string;
  source: string;
  pairs: TradingPair[];
  metadata: {
    totalPairs: number;
    successfulFetches: number;
    failedFetches: number;
    updateInterval: number;
    version: string;
  };
}

class PriceFeedOracle {
  private baseUrl: string;
  private apiKey: string;
  private outputFile: string;
  
  // Predefined trading pairs to fetch
  private readonly TRADING_PAIRS = [
    { base: 'ETH', quote: 'USDC' },
    { base: 'BTC', quote: 'WETH' },
    { base: 'ARB', quote: 'USDC' },
    { base: 'SOL', quote: 'USDC' },
    { base: 'SOMI', quote: 'ETH' }
  ];

  constructor() {
    this.baseUrl = process.env.DIA_API_URL || 'https://api.diadata.org/v1';
    this.apiKey = process.env.DIA_API_KEY || '';
    this.outputFile = './public/priceFeed.json';
  }

  async fetchPairPrice(baseToken: string, quoteToken: string): Promise<TradingPair> {
    try {
      console.log(`Fetching ${baseToken}/${quoteToken} from DIA...`);
      
      // For DIA API, we typically fetch the base token price in USD first
      // Then convert to quote token if needed
      const url = `${this.baseUrl}/quotation/${baseToken}`;
      const headers = this.apiKey ? { 'X-API-Key': this.apiKey } : {};

      const response = await axios.get(url, { headers, timeout: 10000 });
      
      if (response.status !== 200) {
        throw new Error(`DIA API returned status ${response.status}`);
      }

      const data = response.data;
      let finalPrice = data.Price;

      // If quote token is not USD/USDC, we might need additional conversion
      if (quoteToken !== 'USDC' && quoteToken !== 'USD') {
        // For simplicity, we'll use the direct price from DIA
        // In a real implementation, you'd fetch the quote token price and convert
        console.log(`⚠️  Note: ${baseToken}/${quoteToken} using direct DIA price (may need conversion)`);
      }

      const pair: TradingPair = {
        baseToken,
        quoteToken,
        price: finalPrice,
        timestamp: data.Time || new Date().toISOString(),
        source: 'DIA',
        success: true
      };

      console.log(`✅ ${baseToken}/${quoteToken}: ${finalPrice}`);
      return pair;

    } catch (error) {
      console.error(`❌ Failed to fetch ${baseToken}/${quoteToken}:`, error);
      
      return {
        baseToken,
        quoteToken,
        price: 0,
        timestamp: new Date().toISOString(),
        source: 'DIA',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async fetchAllPrices(): Promise<TradingPair[]> {
    console.log('🚀 Fetching all trading pairs from DIA Oracle...\n');
    
    const fetchPromises = this.TRADING_PAIRS.map(({ base, quote }) => 
      this.fetchPairPrice(base, quote)
    );

    const results = await Promise.all(fetchPromises);
    
    const successful = results.filter(pair => pair.success).length;
    const failed = results.filter(pair => !pair.success).length;
    
    console.log(`\n📊 Fetch Summary:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${results.length}`);

    return results;
  }

  savePriceFeed(pairs: TradingPair[]): void {
    try {
      const timestamp = new Date().toISOString();
      const successful = pairs.filter(pair => pair.success).length;
      const failed = pairs.filter(pair => !pair.success).length;

      const priceFeedData: PriceFeedData = {
        lastUpdated: timestamp,
        source: 'DIA Oracle',
        pairs: pairs,
        metadata: {
          totalPairs: pairs.length,
          successfulFetches: successful,
          failedFetches: failed,
          updateInterval: parseInt(process.env.UPDATE_INTERVAL_MS || '5000'),
          version: '1.0.0'
        }
      };

      // Ensure directory exists
      mkdirSync(dirname(this.outputFile), { recursive: true });

      // Write to JSON file
      writeFileSync(this.outputFile, JSON.stringify(priceFeedData, null, 2));
      
      console.log(`\n💾 Price feed saved to: ${this.outputFile}`);
      console.log(`📊 Contains ${successful} successful price feeds`);

    } catch (error) {
      console.error('❌ Error saving price feed:', error);
    }
  }

  async updatePriceFeed(): Promise<PriceFeedData | null> {
    try {
      const pairs = await this.fetchAllPrices();
      this.savePriceFeed(pairs);
      
      return {
        lastUpdated: new Date().toISOString(),
        source: 'DIA Oracle',
        pairs,
        metadata: {
          totalPairs: pairs.length,
          successfulFetches: pairs.filter(p => p.success).length,
          failedFetches: pairs.filter(p => !p.success).length,
          updateInterval: parseInt(process.env.UPDATE_INTERVAL_MS || '5000'),
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('❌ Error updating price feed:', error);
      return null;
    }
  }

  // Continuous monitoring mode
  async startContinuousUpdates(intervalMs: number = 5000): Promise<void> {
    console.log(`🔄 Starting continuous price feed updates every ${intervalMs}ms...\n`);
    
    // Initial fetch
    await this.updatePriceFeed();
    
    // Set up interval
    setInterval(async () => {
      console.log('\n🔄 Updating price feed...');
      await this.updatePriceFeed();
    }, intervalMs);
  }

  displayPriceFeed(pairs: TradingPair[]): void {
    console.log('\n💰 Current Price Feed:');
    console.log('─'.repeat(50));
    
    pairs.forEach(pair => {
      if (pair.success) {
        console.log(`${pair.baseToken}/${pair.quoteToken}: $${pair.price.toFixed(6)}`);
      } else {
        console.log(`${pair.baseToken}/${pair.quoteToken}: ❌ ${pair.error}`);
      }
    });
    
    console.log('─'.repeat(50));
  }
}

// CLI execution
async function main() {
  const oracle = new PriceFeedOracle();
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous') || args.includes('-c')) {
    // Continuous mode
    const interval = parseInt(process.env.UPDATE_INTERVAL_MS || '5000');
    await oracle.startContinuousUpdates(interval);
  } else {
    // Single fetch mode
    console.log('🚀 Starting DIA Oracle Price Feed Fetcher...\n');
    
    const priceFeedData = await oracle.updatePriceFeed();
    
    if (priceFeedData) {
      oracle.displayPriceFeed(priceFeedData.pairs);
      
      console.log('\n📋 Available Commands:');
      console.log('  npm run price:feed           # Single fetch');
      console.log('  npm run price:feed -c        # Continuous updates');
    }
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default PriceFeedOracle;