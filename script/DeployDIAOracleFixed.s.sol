// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/DIAOracleFixed.sol";

contract DeployDIAOracleFixed is Script {
    
    address constant SOMNIA_DIA_PUSH_ORACLE = 0xFb1462A649A92654482F8E048C754333ad85e5C0;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DIA Oracle Fixed Deployment ===");
        console.log("Deployer:", deployer);
        console.log("DIA Oracle:", SOMNIA_DIA_PUSH_ORACLE);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        DIAOracleFixed oracle = new DIAOracleFixed(SOMNIA_DIA_PUSH_ORACLE);
        console.log("DIA Oracle Fixed deployed at:", address(oracle));
        
        vm.stopBroadcast();
        
        // Test price retrieval after deployment
        console.log("\n=== Testing Price Feeds ===");
        
        try oracle.getETHUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ETH/USD Price:", uint256(price));
            console.log("ETH/USD Timestamp:", uint256(timestamp));
            console.log("ETH/USD Price (formatted):", uint256(price) / 1e18, "USD");
        } catch {
            console.log("ETH/USD: Price not available");
        }
        
        try oracle.getBTCUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("BTC/USD Price:", uint256(price));
            console.log("BTC/USD Timestamp:", uint256(timestamp));
            console.log("BTC/USD Price (formatted):", uint256(price) / 1e18, "USD");
        } catch {
            console.log("BTC/USD: Price not available");
        }
        
        try oracle.getARBUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ARB/USD Price:", uint256(price));
            console.log("ARB/USD Timestamp:", uint256(timestamp));
        } catch {
            console.log("ARB/USD: Price not available");
        }
        
        try oracle.getSOLUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("SOL/USD Price:", uint256(price));
            console.log("SOL/USD Timestamp:", uint256(timestamp));
        } catch {
            console.log("SOL/USD: Price not available");
        }
        
        try oracle.getLINKUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("LINK/USD Price:", uint256(price));
            console.log("LINK/USD Timestamp:", uint256(timestamp));
        } catch {
            console.log("LINK/USD: Price not available");
        }
        
        try oracle.getSOMIUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("SOMI/USD Price:", uint256(price));
            console.log("SOMI/USD Timestamp:", uint256(timestamp));
        } catch {
            console.log("SOMI/USD: Price not available");
        }
        
        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", address(oracle));
        console.log("Add to .env: NEXT_PUBLIC_DIA_ORACLE_ADDRESS=", address(oracle));
        
        console.log("\n=== Usage Examples ===");
        console.log("Solidity:");
        console.log("  DIAOracleFixed oracle = DIAOracleFixed(", address(oracle), ");");
        console.log("  (uint128 timestamp, uint128 price) = oracle.getETHUSDPrice();");
        console.log("\nTypeScript:");
        console.log("  const [timestamp, price] = await oracle.getETHUSDPrice();");
        console.log("  const ethPrice = ethers.utils.formatUnits(price, 18);");
    }
}