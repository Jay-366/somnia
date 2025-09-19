// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Interface for DIA Push Oracle Receiver
interface IPushOracleReceiver {
    function updates(string memory key) external view returns (uint128 timestamp, uint128 value);
}

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DIAPushOracle
 * @dev A comprehensive oracle contract that aggregates multiple DIA push oracle price feeds
 * @notice Supports ETH/USDC, BTC/WETH, ARB/USDC, SOL/USDC, LINK/ETH, SOMI/ETH price pairs
 */
contract DIAPushOracle is Ownable, ReentrancyGuard {
    
    // DIA Push Oracle Receiver instance
    IPushOracleReceiver public immutable diaOracle;
    
    // Supported price feed keys
    string public constant ETH_USDC = "ETH/USD";
    string public constant BTC_WETH = "BTC/USD"; // We'll convert to WETH equivalent
    string public constant ARB_USDC = "ARB/USD";
    string public constant SOL_USDC = "SOL/USD";
    string public constant LINK_ETH = "LINK/USD"; // We'll convert to ETH equivalent
    string public constant SOMI_ETH = "SOMI/USD"; // We'll convert to ETH equivalent
    
    // Price feed configuration
    struct PriceFeedConfig {
        string key;
        bool isActive;
        uint256 maxStaleTime; // Maximum time before price is considered stale (in seconds)
        uint8 decimals; // Decimal places for the price
    }
    
    // Mapping of price feed identifiers to their configurations
    mapping(string => PriceFeedConfig) public priceFeedConfigs;
    
    // Array to track all supported price feeds
    string[] public supportedFeeds;
    
    // Events
    event PriceFeedConfigured(string indexed key, bool isActive, uint256 maxStaleTime, uint8 decimals);
    event PriceFeedDeactivated(string indexed key);
    event PriceRequested(string indexed key, uint128 timestamp, uint128 price);
    
    // Errors
    error PriceFeedNotSupported(string key);
    error PriceFeedInactive(string key);
    error StalePrice(string key, uint128 timestamp, uint256 maxStaleTime);
    error InvalidConfiguration();
    
    /**
     * @dev Constructor
     * @param _diaOracleAddress Address of the DIA Push Oracle Receiver contract
     */
    constructor(address _diaOracleAddress) Ownable(msg.sender) {
        require(_diaOracleAddress != address(0), "Invalid oracle address");
        diaOracle = IPushOracleReceiver(_diaOracleAddress);
        
        // Initialize default price feed configurations
        _initializePriceFeeds();
    }
    
    /**
     * @dev Initialize default price feed configurations
     */
    function _initializePriceFeeds() private {
        // Configure ETH/USDC
        _configurePriceFeed(ETH_USDC, true, 3600, 18); // 1 hour max stale time, 18 decimals
        
        // Configure BTC/WETH (using BTC/USD as base)
        _configurePriceFeed(BTC_WETH, true, 3600, 18);
        
        // Configure ARB/USDC
        _configurePriceFeed(ARB_USDC, true, 3600, 18);
        
        // Configure SOL/USDC
        _configurePriceFeed(SOL_USDC, true, 3600, 18);
        
        // Configure LINK/ETH (using LINK/USD as base)
        _configurePriceFeed(LINK_ETH, true, 3600, 18);
        
        // Configure SOMI/ETH (using SOMI/USD as base)
        _configurePriceFeed(SOMI_ETH, true, 3600, 18);
    }
    
    /**
     * @dev Configure a price feed
     * @param key The price feed key
     * @param isActive Whether the feed is active
     * @param maxStaleTime Maximum staleness time in seconds
     * @param decimals Number of decimal places
     */
    function _configurePriceFeed(string memory key, bool isActive, uint256 maxStaleTime, uint8 decimals) private {
        priceFeedConfigs[key] = PriceFeedConfig({
            key: key,
            isActive: isActive,
            maxStaleTime: maxStaleTime,
            decimals: decimals
        });
        
        // Add to supported feeds if not already present
        bool exists = false;
        for (uint i = 0; i < supportedFeeds.length; i++) {
            if (keccak256(bytes(supportedFeeds[i])) == keccak256(bytes(key))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            supportedFeeds.push(key);
        }
        
        emit PriceFeedConfigured(key, isActive, maxStaleTime, decimals);
    }
    
    /**
     * @dev Get the latest price for ETH/USDC
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value
     */
    function getETHUSDCPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return _getPrice(ETH_USDC);
    }
    
    /**
     * @dev Get the latest price for BTC/WETH
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value (in WETH terms)
     */
    function getBTCWETHPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        // Get BTC/USD price and convert to BTC/WETH using ETH/USD
        (uint128 btcTimestamp, uint128 btcPrice) = _getPrice(BTC_WETH);
        (uint128 ethTimestamp, uint128 ethPrice) = _getPrice(ETH_USDC);
        
        // Use the older timestamp for safety
        uint128 finalTimestamp = btcTimestamp < ethTimestamp ? btcTimestamp : ethTimestamp;
        
        // Convert BTC/USD to BTC/WETH: (BTC/USD) / (ETH/USD) = BTC/ETH
        uint128 convertedPrice = ethPrice > 0 ? uint128((uint256(btcPrice) * 1e18) / uint256(ethPrice)) : 0;
        
        return (finalTimestamp, convertedPrice);
    }
    
    /**
     * @dev Get the latest price for ARB/USDC
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value
     */
    function getARBUSDCPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return _getPrice(ARB_USDC);
    }
    
    /**
     * @dev Get the latest price for SOL/USDC
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value
     */
    function getSOLUSDCPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return _getPrice(SOL_USDC);
    }
    
    /**
     * @dev Get the latest price for LINK/ETH
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value (in ETH terms)
     */
    function getLINKETHPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        // Get LINK/USD price and convert to LINK/ETH using ETH/USD
        (uint128 linkTimestamp, uint128 linkPrice) = _getPrice(LINK_ETH);
        (uint128 ethTimestamp, uint128 ethPrice) = _getPrice(ETH_USDC);
        
        // Use the older timestamp for safety
        uint128 finalTimestamp = linkTimestamp < ethTimestamp ? linkTimestamp : ethTimestamp;
        
        // Convert LINK/USD to LINK/ETH: (LINK/USD) / (ETH/USD) = LINK/ETH
        uint128 convertedPrice = ethPrice > 0 ? uint128((uint256(linkPrice) * 1e18) / uint256(ethPrice)) : 0;
        
        return (finalTimestamp, convertedPrice);
    }
    
    /**
     * @dev Get the latest price for SOMI/ETH
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value (in ETH terms)
     */
    function getSOMIETHPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        // Get SOMI/USD price and convert to SOMI/ETH using ETH/USD
        (uint128 somiTimestamp, uint128 somiPrice) = _getPrice(SOMI_ETH);
        (uint128 ethTimestamp, uint128 ethPrice) = _getPrice(ETH_USDC);
        
        // Use the older timestamp for safety
        uint128 finalTimestamp = somiTimestamp < ethTimestamp ? somiTimestamp : ethTimestamp;
        
        // Convert SOMI/USD to SOMI/ETH: (SOMI/USD) / (ETH/USD) = SOMI/ETH
        uint128 convertedPrice = ethPrice > 0 ? uint128((uint256(somiPrice) * 1e18) / uint256(ethPrice)) : 0;
        
        return (finalTimestamp, convertedPrice);
    }
    
    /**
     * @dev Internal function to get price from DIA oracle with validation
     * @param key The price feed key
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value
     */
    function _getPrice(string memory key) 
        internal 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        PriceFeedConfig memory config = priceFeedConfigs[key];
        
        // Check if price feed is supported and active
        if (bytes(config.key).length == 0) {
            revert PriceFeedNotSupported(key);
        }
        
        if (!config.isActive) {
            revert PriceFeedInactive(key);
        }
        
        // Get price from DIA oracle
        (timestamp, price) = diaOracle.updates(key);
        
        // Check if price is stale
        if (block.timestamp > timestamp + config.maxStaleTime) {
            revert StalePrice(key, timestamp, config.maxStaleTime);
        }
        
        return (timestamp, price);
    }
    
    /**
     * @dev Get price for any supported feed by key
     * @param key The price feed key
     * @return timestamp The timestamp of the latest price update
     * @return price The latest price value
     */
    function getPrice(string memory key) 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return _getPrice(key);
    }
    
    /**
     * @dev Get all supported price feeds
     * @return Array of supported price feed keys
     */
    function getSupportedFeeds() external view returns (string[] memory) {
        return supportedFeeds;
    }
    
    /**
     * @dev Check if a price feed is supported
     * @param key The price feed key
     * @return Whether the feed is supported
     */
    function isFeedSupported(string memory key) external view returns (bool) {
        return bytes(priceFeedConfigs[key].key).length > 0;
    }
    
    /**
     * @dev Check if a price feed is active
     * @param key The price feed key
     * @return Whether the feed is active
     */
    function isFeedActive(string memory key) external view returns (bool) {
        return priceFeedConfigs[key].isActive;
    }
    
    /**
     * @dev Get price feed configuration
     * @param key The price feed key
     * @return config The price feed configuration
     */
    function getPriceFeedConfig(string memory key) 
        external 
        view 
        returns (PriceFeedConfig memory config) 
    {
        return priceFeedConfigs[key];
    }
    
    /**
     * @dev Configure a price feed (only owner)
     * @param key The price feed key
     * @param isActive Whether the feed should be active
     * @param maxStaleTime Maximum staleness time in seconds
     * @param decimals Number of decimal places
     */
    function configurePriceFeed(
        string memory key, 
        bool isActive, 
        uint256 maxStaleTime, 
        uint8 decimals
    ) external onlyOwner {
        if (maxStaleTime == 0 || decimals == 0) {
            revert InvalidConfiguration();
        }
        
        _configurePriceFeed(key, isActive, maxStaleTime, decimals);
    }
    
    /**
     * @dev Deactivate a price feed (only owner)
     * @param key The price feed key
     */
    function deactivatePriceFeed(string memory key) external onlyOwner {
        priceFeedConfigs[key].isActive = false;
        emit PriceFeedDeactivated(key);
    }
    
    /**
     * @dev Get multiple prices at once for gas efficiency
     * @param keys Array of price feed keys
     * @return timestamps Array of timestamps
     * @return prices Array of prices
     */
    function getMultiplePrices(string[] memory keys) 
        external 
        view 
        returns (uint128[] memory timestamps, uint128[] memory prices) 
    {
        timestamps = new uint128[](keys.length);
        prices = new uint128[](keys.length);
        
        for (uint i = 0; i < keys.length; i++) {
            (timestamps[i], prices[i]) = _getPrice(keys[i]);
        }
        
        return (timestamps, prices);
    }
    
    /**
     * @dev Emergency function to pause all price feeds (only owner)
     */
    function pauseAllFeeds() external onlyOwner {
        for (uint i = 0; i < supportedFeeds.length; i++) {
            priceFeedConfigs[supportedFeeds[i]].isActive = false;
        }
    }
    
    /**
     * @dev Emergency function to unpause all price feeds (only owner)
     */
    function unpauseAllFeeds() external onlyOwner {
        for (uint i = 0; i < supportedFeeds.length; i++) {
            priceFeedConfigs[supportedFeeds[i]].isActive = true;
        }
    }
}