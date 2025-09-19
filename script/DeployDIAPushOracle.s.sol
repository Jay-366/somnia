// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/DIAPushOracle.sol";

/**
 * @title DeployDIAPushOracle
 * @dev Deployment script for DIA Push Oracle on Somnia Testnet
 */
contract DeployDIAPushOracle is Script {
    
    // DIA Push Oracle address on Somnia Testnet
    address constant SOMNIA_DIA_PUSH_ORACLE = 0xFb1462A649A92654482F8E048C754333ad85e5C0;
    
    function run() external {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DIA Push Oracle Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Network: Somnia Testnet");
        console.log("DIA Push Oracle address:", SOMNIA_DIA_PUSH_ORACLE);
        console.log("Deployer balance:", deployer.balance);
        
        // Check if deployer has sufficient balance
        require(deployer.balance > 0, "Deployer has insufficient balance");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy DIAPushOracle contract
        console.log("\nDeploying DIAPushOracle contract...");
        DIAPushOracle diaOracle = new DIAPushOracle(SOMNIA_DIA_PUSH_ORACLE);
        
        console.log("DIAPushOracle deployed at:", address(diaOracle));
        
        // Verify the deployment by checking supported feeds
        string[] memory supportedFeeds = diaOracle.getSupportedFeeds();
        console.log("\nSupported price feeds:");
        for (uint i = 0; i < supportedFeeds.length; i++) {
            console.log("- ", supportedFeeds[i]);
            
            // Check if feed is active
            bool isActive = diaOracle.isFeedActive(supportedFeeds[i]);
            console.log("  Active:", isActive);
            
            // Get feed configuration
            DIAPushOracle.PriceFeedConfig memory config = diaOracle.getPriceFeedConfig(supportedFeeds[i]);
            console.log("  Max stale time:", config.maxStaleTime, "seconds");
            console.log("  Decimals:", uint256(config.decimals));
        }
        
        // Test price retrieval (this might fail if DIA oracle doesn't have data yet)
        console.log("\nTesting price retrieval...");
        try diaOracle.getETHUSDCPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ETH/USDC Price:", uint256(price));
            console.log("ETH/USDC Timestamp:", uint256(timestamp));
        } catch {
            console.log("ETH/USDC: Price data not available yet");
        }
        
        try diaOracle.getARBUSDCPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ARB/USDC Price:", uint256(price));
            console.log("ARB/USDC Timestamp:", uint256(timestamp));
        } catch {
            console.log("ARB/USDC: Price data not available yet");
        }
        
        try diaOracle.getSOLUSDCPrice() returns (uint128 timestamp, uint128 price) {
            console.log("SOL/USDC Price:", uint256(price));
            console.log("SOL/USDC Timestamp:", uint256(timestamp));
        } catch {
            console.log("SOL/USDC: Price data not available yet");
        }
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("DIAPushOracle Contract:", address(diaOracle));
        console.log("Owner:", diaOracle.owner());
        console.log("DIA Oracle Address:", address(diaOracle.diaOracle()));
        console.log("Total Supported Feeds:", supportedFeeds.length);
        
        console.log("\n=== Integration Instructions ===");
        console.log("1. Add to your .env file:");
        console.log("   NEXT_PUBLIC_DIA_PUSH_ORACLE_ADDRESS=", address(diaOracle));
        
        console.log("\n2. Example usage in Solidity:");
        console.log("   DIAPushOracle oracle = DIAPushOracle(", address(diaOracle), ");");
        console.log("   (uint128 timestamp, uint128 price) = oracle.getETHUSDCPrice();");
        
        console.log("\n3. Available price feeds:");
        console.log("   - getETHUSDCPrice()");
        console.log("   - getBTCWETHPrice()");
        console.log("   - getARBUSDCPrice()");
        console.log("   - getSOLUSDCPrice()");
        console.log("   - getLINKETHPrice()");
        console.log("   - getSOMIETHPrice()");
        
        console.log("\n4. Generic price access:");
        console.log("   oracle.getPrice('ETH/USD')");
        console.log("   oracle.getMultiplePrices(['ETH/USD', 'BTC/USD'])");
        
        console.log("\n=== Deployment Complete ===");
    }
}