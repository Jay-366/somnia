// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/DIAOracleSample.sol";

contract DeployDIAOracleSample is Script {
    
    address constant SOMNIA_DIA_PUSH_ORACLE = 0xFb1462A649A92654482F8E048C754333ad85e5C0;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DIA Oracle Sample Deployment ===");
        console.log("Deployer:", deployer);
        console.log("DIA Oracle:", SOMNIA_DIA_PUSH_ORACLE);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        DIAOracleSample oracle = new DIAOracleSample(SOMNIA_DIA_PUSH_ORACLE);
        console.log("DIA Oracle Sample deployed at:", address(oracle));
        
        // Test price retrieval
        try oracle.getPrice() returns (uint128 timestamp, uint128 price) {
            console.log("ETH/USD Price:", uint256(price));
            console.log("ETH/USD Timestamp:", uint256(timestamp));
        } catch {
            console.log("ETH/USD: Price not available");
        }
        
        try oracle.getBTCPrice() returns (uint128 timestamp, uint128 price) {
            console.log("BTC/USD Price:", uint256(price));
            console.log("BTC/USD Timestamp:", uint256(timestamp));
        } catch {
            console.log("BTC/USD: Price not available");
        }
        
        vm.stopBroadcast();
        
        console.log("=== Deployment Complete ===");
        console.log("Add to .env: NEXT_PUBLIC_DIA_ORACLE_ADDRESS=", address(oracle));
    }
}