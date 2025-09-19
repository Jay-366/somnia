// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/SimplePriceOracle.sol";

contract DeploySimplePriceOracle is Script {
    
    address constant SOMNIA_DIA_PUSH_ORACLE = 0xFb1462A649A92654482F8E048C754333ad85e5C0;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Simple Price Oracle Deployment ===");
        console.log("Deployer:", deployer);
        console.log("DIA Oracle:", SOMNIA_DIA_PUSH_ORACLE);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SimplePriceOracle oracle = new SimplePriceOracle(SOMNIA_DIA_PUSH_ORACLE);
        console.log("Simple Price Oracle deployed at:", address(oracle));
        
        vm.stopBroadcast();
        
        console.log("\n=== Testing Price Feeds ===");
        
        try oracle.getETHUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ETH/USD: ", uint256(price), "at", uint256(timestamp));
        } catch {
            console.log("ETH/USD: Failed to get price");
        }
        
        try oracle.getBTCUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("BTC/USD: ", uint256(price), "at", uint256(timestamp));
        } catch {
            console.log("BTC/USD: Failed to get price");
        }
        
        try oracle.getARBUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ARB/USD: ", uint256(price), "at", uint256(timestamp));
        } catch {
            console.log("ARB/USD: Failed to get price");
        }
        
        try oracle.getSOLUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("SOL/USD: ", uint256(price), "at", uint256(timestamp));
        } catch {
            console.log("SOL/USD: Failed to get price");
        }
        
        try oracle.getLINKUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("LINK/USD: ", uint256(price), "at", uint256(timestamp));
        } catch {
            console.log("LINK/USD: Failed to get price");
        }
        
        try oracle.getSOMIUSDPrice() returns (uint128 timestamp, uint128 price) {
            console.log("SOMI/USD: ", uint256(price), "at", uint256(timestamp));
        } catch {
            console.log("SOMI/USD: Failed to get price");
        }
        
        console.log("\n=== SUCCESS! ===");
        console.log("Contract Address:", address(oracle));
        console.log("NEXT_PUBLIC_DIA_ORACLE_ADDRESS=", address(oracle));
    }
}