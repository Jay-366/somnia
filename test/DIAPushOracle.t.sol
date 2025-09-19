// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/DIAPushOracle.sol";

// Mock DIA Push Oracle Receiver for testing
contract MockPushOracleReceiver {
    
    mapping(string => uint128) public timestamps;
    mapping(string => uint128) public values;
    
    function updates(string memory key) external view returns (uint128 timestamp, uint128 value) {
        return (timestamps[key], values[key]);
    }
    
    function setPrice(string memory key, uint128 timestamp, uint128 value) external {
        timestamps[key] = timestamp;
        values[key] = value;
    }
    
    function setBatchPrices(
        string[] memory keys, 
        uint128[] memory _timestamps, 
        uint128[] memory _values
    ) external {
        require(keys.length == _timestamps.length && _timestamps.length == _values.length, "Array length mismatch");
        
        for (uint i = 0; i < keys.length; i++) {
            timestamps[keys[i]] = _timestamps[i];
            values[keys[i]] = _values[i];
        }
    }
}

/**
 * @title DIAPushOracleTest
 * @dev Comprehensive test suite for DIA Push Oracle contract
 */
contract DIAPushOracleTest is Test {
    
    DIAPushOracle public oracle;
    MockPushOracleReceiver public mockDiaOracle;
    
    address public owner;
    address public user1;
    address public user2;
    
    // Sample price data
    uint128 constant ETH_PRICE = 2000e18; // $2000
    uint128 constant BTC_PRICE = 40000e18; // $40000
    uint128 constant ARB_PRICE = 1e18; // $1
    uint128 constant SOL_PRICE = 100e18; // $100
    uint128 constant LINK_PRICE = 15e18; // $15
    uint128 constant SOMI_PRICE = 10e18; // $10
    
    // Events for testing
    event PriceFeedConfigured(string indexed key, bool isActive, uint256 maxStaleTime, uint8 decimals);
    event PriceFeedDeactivated(string indexed key);
    event PriceRequested(string indexed key, uint128 timestamp, uint128 price);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy mock DIA oracle
        mockDiaOracle = new MockPushOracleReceiver();
        
        // Deploy DIA Push Oracle contract
        oracle = new DIAPushOracle(address(mockDiaOracle));
        
        // Set up initial price data
        _setupInitialPrices();
    }
    
    function _setupInitialPrices() private {
        uint128 currentTime = uint128(block.timestamp);
        
        // Set prices in mock oracle
        mockDiaOracle.setPrice("ETH/USD", currentTime, ETH_PRICE);
        mockDiaOracle.setPrice("BTC/USD", currentTime, BTC_PRICE);
        mockDiaOracle.setPrice("ARB/USD", currentTime, ARB_PRICE);
        mockDiaOracle.setPrice("SOL/USD", currentTime, SOL_PRICE);
        mockDiaOracle.setPrice("LINK/USD", currentTime, LINK_PRICE);
        mockDiaOracle.setPrice("SOMI/USD", currentTime, SOMI_PRICE);
    }
    
    function testDeployment() public {
        // Check that oracle is deployed correctly
        assertEq(address(oracle.diaOracle()), address(mockDiaOracle));
        assertEq(oracle.owner(), owner);
        
        // Check supported feeds
        string[] memory feeds = oracle.getSupportedFeeds();
        assertEq(feeds.length, 6);
        
        // Verify all feeds are supported and active
        assertTrue(oracle.isFeedSupported("ETH/USD"));
        assertTrue(oracle.isFeedSupported("BTC/USD"));
        assertTrue(oracle.isFeedSupported("ARB/USD"));
        assertTrue(oracle.isFeedSupported("SOL/USD"));
        assertTrue(oracle.isFeedSupported("LINK/USD"));
        assertTrue(oracle.isFeedSupported("SOMI/USD"));
        
        assertTrue(oracle.isFeedActive("ETH/USD"));
        assertTrue(oracle.isFeedActive("BTC/USD"));
        assertTrue(oracle.isFeedActive("ARB/USD"));
        assertTrue(oracle.isFeedActive("SOL/USD"));
        assertTrue(oracle.isFeedActive("LINK/USD"));
        assertTrue(oracle.isFeedActive("SOMI/USD"));
    }
    
    function testGetETHUSDCPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getETHUSDCPrice();
        
        assertEq(price, ETH_PRICE);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetBTCWETHPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getBTCWETHPrice();
        
        // BTC/WETH = BTC/USD / ETH/USD = 40000 / 2000 = 20
        uint128 expectedPrice = uint128((uint256(BTC_PRICE) * 1e18) / uint256(ETH_PRICE));
        
        assertEq(price, expectedPrice);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetARBUSDCPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getARBUSDCPrice();
        
        assertEq(price, ARB_PRICE);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetSOLUSDCPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getSOLUSDCPrice();
        
        assertEq(price, SOL_PRICE);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetLINKETHPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getLINKETHPrice();
        
        // LINK/ETH = LINK/USD / ETH/USD = 15 / 2000 = 0.0075
        uint128 expectedPrice = uint128((uint256(LINK_PRICE) * 1e18) / uint256(ETH_PRICE));
        
        assertEq(price, expectedPrice);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetSOMIETHPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getSOMIETHPrice();
        
        // SOMI/ETH = SOMI/USD / ETH/USD = 10 / 2000 = 0.005
        uint128 expectedPrice = uint128((uint256(SOMI_PRICE) * 1e18) / uint256(ETH_PRICE));
        
        assertEq(price, expectedPrice);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetPrice() public {
        (uint128 timestamp, uint128 price) = oracle.getPrice("ETH/USD");
        
        assertEq(price, ETH_PRICE);
        assertEq(timestamp, uint128(block.timestamp));
    }
    
    function testGetMultiplePrices() public {
        string[] memory keys = new string[](3);
        keys[0] = "ETH/USD";
        keys[1] = "BTC/USD";
        keys[2] = "ARB/USD";
        
        (uint128[] memory timestamps, uint128[] memory prices) = oracle.getMultiplePrices(keys);
        
        assertEq(timestamps.length, 3);
        assertEq(prices.length, 3);
        
        assertEq(prices[0], ETH_PRICE);
        assertEq(prices[1], BTC_PRICE);
        assertEq(prices[2], ARB_PRICE);
        
        assertEq(timestamps[0], uint128(block.timestamp));
        assertEq(timestamps[1], uint128(block.timestamp));
        assertEq(timestamps[2], uint128(block.timestamp));
    }
    
    function testPriceFeedConfiguration() public {
        DIAPushOracle.PriceFeedConfig memory config = oracle.getPriceFeedConfig("ETH/USD");
        
        assertEq(config.key, "ETH/USD");
        assertTrue(config.isActive);
        assertEq(config.maxStaleTime, 3600); // 1 hour
        assertEq(config.decimals, 18);
    }
    
    function testConfigurePriceFeed() public {
        string memory newKey = "NEW/USD";
        
        vm.expectEmit(true, false, false, true);
        emit PriceFeedConfigured(newKey, true, 7200, 8);
        
        oracle.configurePriceFeed(newKey, true, 7200, 8);
        
        assertTrue(oracle.isFeedSupported(newKey));
        assertTrue(oracle.isFeedActive(newKey));
        
        DIAPushOracle.PriceFeedConfig memory config = oracle.getPriceFeedConfig(newKey);
        assertEq(config.maxStaleTime, 7200);
        assertEq(config.decimals, 8);
    }
    
    function testDeactivatePriceFeed() public {
        vm.expectEmit(true, false, false, true);
        emit PriceFeedDeactivated("ETH/USD");
        
        oracle.deactivatePriceFeed("ETH/USD");
        
        assertTrue(oracle.isFeedSupported("ETH/USD"));
        assertFalse(oracle.isFeedActive("ETH/USD"));
    }
    
    function testPauseAndUnpauseAllFeeds() public {
        // Pause all feeds
        oracle.pauseAllFeeds();
        
        string[] memory feeds = oracle.getSupportedFeeds();
        for (uint i = 0; i < feeds.length; i++) {
            assertFalse(oracle.isFeedActive(feeds[i]));
        }
        
        // Unpause all feeds
        oracle.unpauseAllFeeds();
        
        for (uint i = 0; i < feeds.length; i++) {
            assertTrue(oracle.isFeedActive(feeds[i]));
        }
    }
    
    function testStalePrice() public {
        // Move time forward beyond max stale time
        vm.warp(block.timestamp + 3601); // 1 hour + 1 second
        
        // Should revert due to stale price
        vm.expectRevert(abi.encodeWithSelector(
            DIAPushOracle.StalePrice.selector,
            "ETH/USD",
            uint128(block.timestamp - 3601),
            3600
        ));
        oracle.getETHUSDCPrice();
    }
    
    function testUnsupportedPriceFeed() public {
        vm.expectRevert(abi.encodeWithSelector(
            DIAPushOracle.PriceFeedNotSupported.selector,
            "UNSUPPORTED/USD"
        ));
        oracle.getPrice("UNSUPPORTED/USD");
    }
    
    function testInactivePriceFeed() public {
        oracle.deactivatePriceFeed("ETH/USD");
        
        vm.expectRevert(abi.encodeWithSelector(
            DIAPushOracle.PriceFeedInactive.selector,
            "ETH/USD"
        ));
        oracle.getETHUSDCPrice();
    }
    
    function testOnlyOwnerModifiers() public {
        vm.prank(user1);
        vm.expectRevert();
        oracle.configurePriceFeed("TEST/USD", true, 3600, 18);
        
        vm.prank(user1);
        vm.expectRevert();
        oracle.deactivatePriceFeed("ETH/USD");
        
        vm.prank(user1);
        vm.expectRevert();
        oracle.pauseAllFeeds();
        
        vm.prank(user1);
        vm.expectRevert();
        oracle.unpauseAllFeeds();
    }
    
    function testInvalidConfiguration() public {
        vm.expectRevert(abi.encodeWithSelector(
            DIAPushOracle.InvalidConfiguration.selector
        ));
        oracle.configurePriceFeed("TEST/USD", true, 0, 18); // Zero max stale time
        
        vm.expectRevert(abi.encodeWithSelector(
            DIAPushOracle.InvalidConfiguration.selector
        ));
        oracle.configurePriceFeed("TEST/USD", true, 3600, 0); // Zero decimals
    }
    
    function testEventEmission() public {
        // Event emission test removed since PriceRequested event was removed from view functions
        // to maintain view function purity. Events are still emitted for configuration changes.
        vm.expectEmit(true, false, false, true);
        emit PriceFeedConfigured("TEST/USD", true, 7200, 8);
        
        oracle.configurePriceFeed("TEST/USD", true, 7200, 8);
    }
    
    function testPriceConversions() public {
        // Test edge case where ETH price is 0 (should not divide by zero)
        mockDiaOracle.setPrice("ETH/USD", uint128(block.timestamp), 0);
        
        (uint128 timestamp, uint128 price) = oracle.getBTCWETHPrice();
        assertEq(price, 0); // Should return 0 when ETH price is 0
        
        // Test with very small prices
        mockDiaOracle.setPrice("ETH/USD", uint128(block.timestamp), 1);
        mockDiaOracle.setPrice("LINK/USD", uint128(block.timestamp), 1);
        
        (timestamp, price) = oracle.getLINKETHPrice();
        assertEq(price, 1e18); // 1/1 = 1 ETH
    }
    
    function testGasUsage() public {
        // Test gas usage for single price retrieval
        uint256 gasBefore = gasleft();
        oracle.getETHUSDCPrice();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for single price retrieval:", gasUsed);
        assertTrue(gasUsed < 100000); // Should be reasonably efficient
        
        // Test gas usage for multiple price retrieval
        string[] memory keys = new string[](6);
        keys[0] = "ETH/USD";
        keys[1] = "BTC/USD";
        keys[2] = "ARB/USD";
        keys[3] = "SOL/USD";
        keys[4] = "LINK/USD";
        keys[5] = "SOMI/USD";
        
        gasBefore = gasleft();
        oracle.getMultiplePrices(keys);
        gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for multiple price retrieval:", gasUsed);
        assertTrue(gasUsed < 500000); // Should be reasonably efficient for batch
    }
    
    function testFuzzPriceValues(uint128 ethPrice, uint128 btcPrice) public {
        vm.assume(ethPrice > 0 && ethPrice < type(uint64).max);
        vm.assume(btcPrice > 0 && btcPrice < type(uint64).max);
        
        mockDiaOracle.setPrice("ETH/USD", uint128(block.timestamp), ethPrice);
        mockDiaOracle.setPrice("BTC/USD", uint128(block.timestamp), btcPrice);
        
        (uint128 timestamp, uint128 price) = oracle.getBTCWETHPrice();
        
        uint128 expectedPrice = uint128((uint256(btcPrice) * 1e18) / uint256(ethPrice));
        assertEq(price, expectedPrice);
        assertEq(timestamp, uint128(block.timestamp));
    }
}