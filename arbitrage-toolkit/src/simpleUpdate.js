const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// DIA Oracle contract details
const ORACLE_ADDRESS = '0xbFbA9b0ABBFBc718D05E18Bc954967ac192bF81B';
const SOMNIA_RPC = 'https://dream-rpc.somnia.network/';

// Simple Oracle ABI
const ORACLE_ABI = [
  "function getETHUSDPrice() view returns (uint128 timestamp, uint128 price)",
  "function getBTCUSDPrice() view returns (uint128 timestamp, uint128 price)"
];

async function updatePriceFeeds() {
  try {
    console.log('🚀 Starting price feed update...');
    
    // Create provider with timeout settings
    const provider = new ethers.JsonRpcProvider(SOMNIA_RPC, {
      name: 'somnia',
      chainId: 50312
    }, {
      timeout: 30000,
      retryLimit: 3
    });
    
    const contract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
    
    console.log('📡 Fetching ETH and BTC prices...');
    
    // Fetch ETH price
    let ethData = null;
    try {
      const [ethTimestamp, ethPrice] = await contract.getETHUSDPrice();
      if (ethPrice > 0n) {
        // DIA oracle returns raw price values, need to divide by 100000000 (8 decimals)
        const ethPriceFormatted = Number(ethPrice) / 100000000;
        ethData = {
          symbol: 'ETH/USD',
          name: 'Ethereum',
          price: ethPriceFormatted.toFixed(2),
          timestamp: Number(ethTimestamp),
          source: 'DIA Oracle'
        };
        console.log(`✅ ETH: $${ethPriceFormatted.toLocaleString()}`);
      }
    } catch (error) {
      console.log('⚠️ ETH price fetch failed:', error.message);
    }
    
    // Fetch BTC price
    let btcData = null;
    try {
      const [btcTimestamp, btcPrice] = await contract.getBTCUSDPrice();
      if (btcPrice > 0n) {
        // DIA oracle returns raw price values, need to divide by 100000000 (8 decimals)
        const btcPriceFormatted = Number(btcPrice) / 100000000;
        btcData = {
          symbol: 'BTC/USD',
          name: 'Bitcoin',
          price: btcPriceFormatted.toFixed(2),
          timestamp: Number(btcTimestamp),
          source: 'DIA Oracle'
        };
        console.log(`✅ BTC: $${btcPriceFormatted.toLocaleString()}`);
      }
    } catch (error) {
      console.log('⚠️ BTC price fetch failed:', error.message);
    }
    
    // Build feeds array
    const feeds = [];
    if (ethData) feeds.push(ethData);
    if (btcData) feeds.push(btcData);
    
    if (feeds.length === 0) {
      console.log('⚠️ No price data available');
      return;
    }
    
    // Create price feed data
    const priceFeedData = {
      lastUpdated: new Date().toISOString(),
      source: 'DIA Push Oracle on Somnia Testnet',
      pairs: feeds,
      metadata: {
        totalPairs: feeds.length,
        successfulFetches: feeds.length,
        failedFetches: 0,
        updateInterval: 5000,
        version: '1.1.0'
      }
    };
    
    // Write to file
    const filePath = path.join(__dirname, '../public/priceFeed.json');
    fs.writeFileSync(filePath, JSON.stringify(priceFeedData, null, 2));
    
    console.log('✅ Successfully updated priceFeed.json');
    console.log(`📊 Updated ${feeds.length} price feeds`);
    feeds.forEach(feed => {
      console.log(`   ${feed.symbol}: $${feed.price}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to update price feeds:', error.message);
  }
}

// Run the update
updatePriceFeeds()
  .then(() => {
    console.log('🎉 Price feed update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });