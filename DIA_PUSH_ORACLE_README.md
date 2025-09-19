# DIA Push Oracle Smart Contract

## Overview

The `DIAPushOracle` smart contract provides a comprehensive interface for accessing real-time price feeds from DIA's Push Oracle system. It supports multiple cryptocurrency price pairs and includes advanced features like staleness protection, batch price retrieval, and administrative controls.

## Supported Price Feeds

- **ETH/USDC** - Ethereum to USD Coin
- **BTC/WETH** - Bitcoin to Wrapped Ethereum (converted from BTC/USD and ETH/USD)
- **ARB/USDC** - Arbitrum to USD Coin
- **SOL/USDC** - Solana to USD Coin
- **LINK/ETH** - Chainlink to Ethereum (converted from LINK/USD and ETH/USD)
- **SOMI/ETH** - Somnia to Ethereum (converted from SOMI/USD and ETH/USD)

## Contract Architecture

### Core Components

1. **PushOracleReceiver Integration**: Connects to DIA's Push Oracle Receiver contract
2. **Price Feed Configuration**: Configurable parameters for each price feed
3. **Staleness Protection**: Prevents usage of outdated price data
4. **Access Control**: Owner-based administrative functions
5. **Batch Operations**: Efficient retrieval of multiple prices

### Key Features

- **Real-time Price Updates**: Receives push-based updates from DIA Oracle
- **Automatic Price Conversion**: Converts USD-based prices to relative pairs (e.g., BTC/WETH)
- **Staleness Validation**: Configurable maximum age for price data
- **Emergency Controls**: Pause/unpause functionality for all feeds
- **Gas Optimization**: Batch price retrieval for multiple feeds

## Deployment

### Prerequisites

1. **Environment Setup**:
   ```bash
   # Add to your .env file
   PRIVATE_KEY=your_deployment_private_key
   SOMNIA_RPC=https://rpc.somnia.network
   ```

2. **Install Dependencies**:
   ```bash
   forge install
   ```

### Deploy to Somnia Testnet

```bash
# Deploy the contract
forge script script/DeployDIAPushOracle.s.sol --rpc-url somnia --broadcast -vvv

# Alternative with environment variable
forge script script/DeployDIAPushOracle.s.sol --rpc-url $SOMNIA_RPC --broadcast -vvv
```

### Post-Deployment

1. **Update Environment Variables**:
   ```bash
   # Add the deployed contract address to .env
   NEXT_PUBLIC_DIA_PUSH_ORACLE_ADDRESS=<deployed_contract_address>
   ```

2. **Verify Deployment**:
   ```bash
   # Check supported feeds
   cast call $DEPLOYED_ADDRESS "getSupportedFeeds()" --rpc-url somnia
   
   # Test price retrieval
   cast call $DEPLOYED_ADDRESS "getETHUSDCPrice()" --rpc-url somnia
   ```

## Usage

### Solidity Integration

```solidity
pragma solidity ^0.8.13;

import "./contracts/DIAPushOracle.sol";

contract MyContract {
    DIAPushOracle public priceOracle;
    
    constructor(address _oracleAddress) {
        priceOracle = DIAPushOracle(_oracleAddress);
    }
    
    function getLatestETHPrice() external view returns (uint128 timestamp, uint128 price) {
        return priceOracle.getETHUSDCPrice();
    }
    
    function getMultiplePrices() external view returns (uint128[] memory timestamps, uint128[] memory prices) {
        string[] memory keys = new string[](2);
        keys[0] = "ETH/USD";
        keys[1] = "BTC/USD";
        return priceOracle.getMultiplePrices(keys);
    }
}
```

### Frontend Integration (TypeScript)

```typescript
import { ethers } from 'ethers';
import DIAPushOracleABI from './abis/DIAPushOracle.json';

const oracleContract = new ethers.Contract(
  process.env.NEXT_PUBLIC_DIA_PUSH_ORACLE_ADDRESS,
  DIAPushOracleABI,
  provider
);

// Get ETH/USDC price
const [timestamp, price] = await oracleContract.getETHUSDCPrice();
console.log(`ETH Price: $${ethers.utils.formatUnits(price, 18)}`);

// Get multiple prices
const keys = ['ETH/USD', 'BTC/USD', 'ARB/USD'];
const [timestamps, prices] = await oracleContract.getMultiplePrices(keys);

// Check if feed is active
const isActive = await oracleContract.isFeedActive('ETH/USD');
```

## API Reference

### Price Retrieval Functions

#### `getETHUSDCPrice()`
Returns the latest ETH/USDC price.
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getBTCWETHPrice()`
Returns the latest BTC/WETH price (converted from BTC/USD and ETH/USD).
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getARBUSDCPrice()`
Returns the latest ARB/USDC price.
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getSOLUSDCPrice()`
Returns the latest SOL/USDC price.
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getLINKETHPrice()`
Returns the latest LINK/ETH price (converted from LINK/USD and ETH/USD).
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getSOMIETHPrice()`
Returns the latest SOMI/ETH price (converted from SOMI/USD and ETH/USD).
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getPrice(string memory key)`
Returns the price for any supported feed by key.
- **Parameters**: `key` - The price feed identifier (e.g., "ETH/USD")
- **Returns**: `(uint128 timestamp, uint128 price)`

#### `getMultiplePrices(string[] memory keys)`
Returns prices for multiple feeds in a single call (gas efficient).
- **Parameters**: `keys` - Array of price feed identifiers
- **Returns**: `(uint128[] memory timestamps, uint128[] memory prices)`

### Information Functions

#### `getSupportedFeeds()`
Returns all supported price feed keys.
- **Returns**: `string[] memory`

#### `isFeedSupported(string memory key)`
Checks if a price feed is supported.
- **Returns**: `bool`

#### `isFeedActive(string memory key)`
Checks if a price feed is currently active.
- **Returns**: `bool`

#### `getPriceFeedConfig(string memory key)`
Returns the configuration for a specific price feed.
- **Returns**: `PriceFeedConfig memory`

### Administrative Functions (Owner Only)

#### `configurePriceFeed(string memory key, bool isActive, uint256 maxStaleTime, uint8 decimals)`
Configure or add a new price feed.

#### `deactivatePriceFeed(string memory key)`
Deactivate a specific price feed.

#### `pauseAllFeeds()`
Emergency pause all price feeds.

#### `unpauseAllFeeds()`
Resume all price feeds.

## Configuration

### Default Settings

- **Max Stale Time**: 3600 seconds (1 hour)
- **Decimals**: 18 for all feeds
- **All feeds active by default**

### Price Feed Keys

- `ETH/USD` - Ethereum price in USD
- `BTC/USD` - Bitcoin price in USD
- `ARB/USD` - Arbitrum price in USD
- `SOL/USD` - Solana price in USD
- `LINK/USD` - Chainlink price in USD
- `SOMI/USD` - Somnia price in USD

## Error Handling

### Custom Errors

- `PriceFeedNotSupported(string key)` - Feed is not configured
- `PriceFeedInactive(string key)` - Feed is deactivated
- `StalePrice(string key, uint128 timestamp, uint256 maxStaleTime)` - Price data is too old
- `InvalidConfiguration()` - Invalid configuration parameters

### Error Examples

```solidity
try oracle.getETHUSDCPrice() returns (uint128 timestamp, uint128 price) {
    // Use price data
} catch (bytes memory reason) {
    // Handle errors
    if (bytes4(reason) == DIAPushOracle.StalePrice.selector) {
        // Handle stale price
    } else if (bytes4(reason) == DIAPushOracle.PriceFeedInactive.selector) {
        // Handle inactive feed
    }
}
```

## Testing

### Run Tests

```bash
# Run all tests
forge test --match-path "test/DIAPushOracle.t.sol" -vvv

# Run specific test
forge test --match-test "testGetETHUSDCPrice" -vvv

# Test coverage
forge coverage --match-path "test/DIAPushOracle.t.sol"

# Gas report
forge test --gas-report
```

### Test Coverage

The test suite covers:
- ✅ Price retrieval for all supported feeds
- ✅ Price conversion calculations
- ✅ Staleness validation
- ✅ Access control
- ✅ Configuration management
- ✅ Error conditions
- ✅ Gas optimization
- ✅ Edge cases and fuzzing

## Gas Usage

| Function | Estimated Gas |
|----------|---------------|
| `getETHUSDCPrice()` | ~50,000 |
| `getBTCWETHPrice()` | ~85,000 |
| `getMultiplePrices(6)` | ~250,000 |
| `configurePriceFeed()` | ~70,000 |

## Security Considerations

### Access Control
- Owner can configure feeds and emergency controls
- No external dependencies beyond DIA Oracle
- Immutable oracle address prevents rug pulls

### Price Validation
- Staleness protection prevents outdated data usage
- Conversion calculations handle edge cases (zero division)
- Input validation on all administrative functions

### Best Practices
- Always check if feeds are active before usage
- Handle staleness errors gracefully
- Use batch functions for multiple price retrieval
- Monitor feed status in production

## Network Information

### Somnia Testnet
- **DIA Push Oracle**: `0xFb1462A649A92654482F8E048C754333ad85e5C0`
- **Network RPC**: `https://rpc.somnia.network`
- **Chain ID**: `50312`

## Integration Examples

### DeFi Protocol Integration

```solidity
contract DEXPriceChecker {
    DIAPushOracle public oracle;
    uint256 public constant PRICE_DEVIATION_THRESHOLD = 500; // 5%
    
    function checkArbitrageOpportunity() external view returns (bool) {
        (uint128 timestamp, uint128 ethPrice) = oracle.getETHUSDCPrice();
        require(block.timestamp - timestamp < 300, "Price too stale"); // 5 minutes
        
        // Compare with DEX price logic here
        return true;
    }
}
```

### Frontend Price Display

```typescript
const usePriceFeeds = () => {
  const [prices, setPrices] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const feeds = ['ETH/USD', 'BTC/USD', 'ARB/USD'];
        const [timestamps, priceValues] = await oracleContract.getMultiplePrices(feeds);
        
        const formattedPrices = feeds.reduce((acc, feed, index) => {
          acc[feed] = ethers.utils.formatUnits(priceValues[index], 18);
          return acc;
        }, {} as Record<string, string>);
        
        setPrices(formattedPrices);
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  return prices;
};
```

## Troubleshooting

### Common Issues

1. **"Price feed not supported"**
   - Verify the feed key spelling
   - Check if feed is configured: `isFeedSupported(key)`

2. **"Stale price" error**
   - Price data is older than maxStaleTime
   - Check DIA Oracle connectivity
   - Consider increasing maxStaleTime for testing

3. **"Price feed inactive"**
   - Feed has been deactivated
   - Check with `isFeedActive(key)`
   - Contact admin to reactivate

4. **Gas estimation issues**
   - Use static calls for price retrieval
   - Batch multiple price requests
   - Consider caching frequently accessed prices

### Monitoring

```bash
# Check contract status
cast call $ORACLE_ADDRESS "getSupportedFeeds()" --rpc-url somnia

# Monitor specific feed
cast call $ORACLE_ADDRESS "isFeedActive(string)" "ETH/USD" --rpc-url somnia

# Get latest price
cast call $ORACLE_ADDRESS "getETHUSDCPrice()" --rpc-url somnia
```

## Contributing

When adding new price feeds or features:

1. Update the contract with new feed constants
2. Add corresponding getter functions
3. Update tests to cover new functionality
4. Update this documentation
5. Test on testnet before mainnet deployment

## License

This contract is released under the MIT License.