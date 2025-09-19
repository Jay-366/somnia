import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// DIA Oracle contract details
const ORACLE_ADDRESS = '0xbFbA9b0ABBFBc718D05E18Bc954967ac192bF81B';
const SOMNIA_RPC = 'https://dream-rpc.somnia.network/';

// Oracle ABI - just the functions we need
const ORACLE_ABI = [
  "function getETHUSDPrice() view returns (uint128 timestamp, uint128 price)",
  "function getBTCUSDPrice() view returns (uint128 timestamp, uint128 price)", 
  "function getARBUSDPrice() view returns (uint128 timestamp, uint128 price)",
  "function getSOLUSDPrice() view returns (uint128 timestamp, uint128 price)",
  "function getLINKUSDPrice() view returns (uint128 timestamp, uint128 price)",
  "function getSOMIUSDPrice() view returns (uint128 timestamp, uint128 price)",
  "function getAllPrices() view returns (uint128[6] memory timestamps, uint128[6] memory prices, string[6] memory keys)"
];

interface PriceFeedData {
  symbol: string;
  name: string;
  price: string;
  change24h?: string;
  volume?: string;
  timestamp: number;
  source: string;
}

interface PriceFeedJson {
  lastUpdated: string;
  source: string;
  feeds: PriceFeedData[];
}

class DIAOraclePriceFetcher {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(SOMNIA_RPC);
    this.contract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, this.provider);
  }

  async fetchAllPrices(): Promise<PriceFeedData[]> {
    console.log('📡 Fetching prices from DIA Oracle...');
    
    const feeds: PriceFeedData[] = [];

    try {
      // Fetch individual prices with better error handling
      const pricePromises = [
        this.fetchPrice('ETH', 'getETHUSDPrice', 'Ethereum'),
        this.fetchPrice('BTC', 'getBTCUSDPrice', 'Bitcoin'),
        this.fetchPrice('ARB', 'getARBUSDPrice', 'Arbitrum'),
        this.fetchPrice('SOL', 'getSOLUSDPrice', 'Solana'),
        this.fetchLink('LINK', 'getLINKUSDPrice', 'Chainlink'),
        this.fetchSomi('SOMI', 'getSOMIUSDPrice', 'Somnia')
      ];

      const results = await Promise.allSettled(pricePromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          feeds.push(result.value);
        } else {
          console.warn(`⚠️  Failed to fetch price for feed ${index}:`, result.status === 'rejected' ? result.reason : 'No data');
        }
      });

    } catch (error) {
      console.error('❌ Error fetching prices:', error);
      throw error;
    }

    return feeds;
  }

  private async fetchPrice(symbol: string, method: string, name: string): Promise<PriceFeedData | null> {
    try {
      const [timestamp, price] = await this.contract.getFunction(method)();
      
      if (price === 0n || timestamp === 0n) {
        console.log(`⏳ ${symbol}: No data available yet`);
        return null;
      }

      const priceFormatted = ethers.formatUnits(price, 18);
      const timestampNumber = Number(timestamp);

      console.log(`✅ ${symbol}: $${parseFloat(priceFormatted).toLocaleString()}`);

      return {
        symbol: `${symbol}/USD`,
        name: name,
        price: parseFloat(priceFormatted).toFixed(2),
        timestamp: timestampNumber,
        source: 'DIA Oracle'
      };
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} price:`, error);
      return null;
    }
  }

  private async fetchLink(symbol: string, method: string, name: string): Promise<PriceFeedData | null> {
    try {
      // LINK/ETH price from our oracle
      const [timestamp, linkEthPrice] = await this.contract.getFunction(method)();
      
      if (linkEthPrice === 0n || timestamp === 0n) {
        console.log(`⏳ ${symbol}: No data available yet`);
        return null;
      }

      // Get ETH/USD price to convert LINK/ETH to LINK/USD
      const [, ethPrice] = await this.contract.getFunction('getETHUSDPrice')();
      
      if (ethPrice === 0n) {
        console.log(`⏳ ${symbol}: ETH price needed for conversion not available`);
        return null;
      }

      // Convert LINK/ETH to LINK/USD: LINK/ETH * ETH/USD = LINK/USD
      const linkEthFormatted = parseFloat(ethers.formatUnits(linkEthPrice, 18));
      const ethUsdFormatted = parseFloat(ethers.formatUnits(ethPrice, 18));
      const linkUsdPrice = linkEthFormatted * ethUsdFormatted;

      console.log(`✅ ${symbol}: $${linkUsdPrice.toLocaleString()} (converted from LINK/ETH)`);

      return {
        symbol: `${symbol}/USD`,
        name: name,
        price: linkUsdPrice.toFixed(2),
        timestamp: Number(timestamp),
        source: 'DIA Oracle (converted)'
      };
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} price:`, error);
      return null;
    }
  }

  private async fetchSomi(symbol: string, method: string, name: string): Promise<PriceFeedData | null> {
    try {
      // SOMI/ETH price from our oracle
      const [timestamp, somiEthPrice] = await this.contract.getFunction(method)();
      
      if (somiEthPrice === 0n || timestamp === 0n) {
        console.log(`⏳ ${symbol}: No data available yet`);
        return null;
      }

      // Get ETH/USD price to convert SOMI/ETH to SOMI/USD
      const [, ethPrice] = await this.contract.getFunction('getETHUSDPrice')();
      
      if (ethPrice === 0n) {
        console.log(`⏳ ${symbol}: ETH price needed for conversion not available`);
        return null;
      }

      // Convert SOMI/ETH to SOMI/USD: SOMI/ETH * ETH/USD = SOMI/USD
      const somiEthFormatted = parseFloat(ethers.formatUnits(somiEthPrice, 18));
      const ethUsdFormatted = parseFloat(ethers.formatUnits(ethPrice, 18));
      const somiUsdPrice = somiEthFormatted * ethUsdFormatted;

      console.log(`✅ ${symbol}: $${somiUsdPrice.toLocaleString()} (converted from SOMI/ETH)`);

      return {
        symbol: `${symbol}/USD`,
        name: name,
        price: somiUsdPrice.toFixed(2),
        timestamp: Number(timestamp),
        source: 'DIA Oracle (converted)'
      };
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} price:`, error);
      return null;
    }
  }

  async updatePriceFeedJson(): Promise<void> {
    try {
      console.log('🚀 Starting price feed update...');
      
      const feeds = await this.fetchAllPrices();
      
      if (feeds.length === 0) {
        console.warn('⚠️  No price data available, keeping existing file');
        return;
      }

      const priceFeedData: PriceFeedJson = {
        lastUpdated: new Date().toISOString(),
        source: 'DIA Push Oracle on Somnia Testnet',
        feeds: feeds
      };

      // Write to public folder
      const publicPath = path.join(__dirname, '../public/priceFeed.json');
      fs.writeFileSync(publicPath, JSON.stringify(priceFeedData, null, 2));
      
      console.log('✅ Successfully updated priceFeed.json');
      console.log(`📊 Updated ${feeds.length} price feeds`);
      console.log(`📍 File location: ${publicPath}`);
      
      // Log summary
      feeds.forEach(feed => {
        console.log(`   ${feed.symbol}: $${feed.price}`);
      });

    } catch (error) {
      console.error('❌ Failed to update price feed:', error);
      throw error;
    }
  }
}

// Export for use in other modules
export { DIAOraclePriceFetcher };

// CLI execution
if (require.main === module) {
  const fetcher = new DIAOraclePriceFetcher();
  
  fetcher.updatePriceFeedJson()
    .then(() => {
      console.log('🎉 Price feed update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Price feed update failed:', error);
      process.exit(1);
    });
}