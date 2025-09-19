import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface DiaPrice {
  symbol: string;
  name: string;
  price: number;
  timestamp: string;
  source: string;
}

export interface DiaPriceResponse {
  Symbol: string;
  Name: string;
  Price: number;
  Time: string;
  Source: string;
}

class DiaPriceFetcher {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.DIA_API_URL || 'https://api.diadata.org/v1';
    this.apiKey = process.env.DIA_API_KEY || '';
  }

  async fetchPrice(symbol: string): Promise<DiaPrice | null> {
    try {
      const url = `${this.baseUrl}/quotation/${symbol}`;
      const headers = this.apiKey ? { 'X-API-Key': this.apiKey } : {};

      console.log(`Fetching DIA price for ${symbol}...`);
      
      const response = await axios.get<DiaPriceResponse>(url, { headers });
      
      if (response.status !== 200) {
        throw new Error(`DIA API returned status ${response.status}`);
      }

      const data = response.data;
      
      const price: DiaPrice = {
        symbol: data.Symbol,
        name: data.Name,
        price: data.Price,
        timestamp: data.Time,
        source: 'DIA'
      };

      console.log(`✅ DIA price for ${symbol}: $${price.price}`);
      return price;

    } catch (error) {
      console.error(`❌ Error fetching DIA price for ${symbol}:`, error);
      return null;
    }
  }

  async fetchMultiplePrices(symbols: string[]): Promise<(DiaPrice | null)[]> {
    const promises = symbols.map(symbol => this.fetchPrice(symbol));
    return Promise.all(promises);
  }
}

// CLI execution
async function main() {
  const fetcher = new DiaPriceFetcher();
  
  // Default symbols to fetch if none provided
  const symbols = process.argv.slice(2).length > 0 
    ? process.argv.slice(2) 
    : ['ETH', 'USDC', 'WBTC'];

  console.log('🚀 Starting DIA price fetcher...');
  console.log(`Fetching prices for: ${symbols.join(', ')}\n`);

  const prices = await fetcher.fetchMultiplePrices(symbols);
  
  console.log('\n📊 Results:');
  prices.forEach((price, index) => {
    if (price) {
      console.log(`${symbols[index]}: $${price.price} (${price.timestamp})`);
    } else {
      console.log(`${symbols[index]}: Failed to fetch`);
    }
  });
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default DiaPriceFetcher;