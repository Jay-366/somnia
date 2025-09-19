// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/DIAPushOracle.sol";

/**
 * @title DeployDIAPushOracleSimple
 * @dev Simplified deployment script for DIA Push Oracle on Somnia Testnet
 */
contract DeployDIAPushOracleSimple is Script {
    
    // DIA Push Oracle address on Somnia Testnet
    address constant SOMNIA_DIA_PUSH_ORACLE = 0xFb1462A649A92654482F8E048C754333ad85e5C0;
    
    function run() external {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Simple DIA Push Oracle Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("DIA Push Oracle address:", SOMNIA_DIA_PUSH_ORACLE);
        console.log("Deployer balance:", deployer.balance);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy DIAPushOracle contract
        console.log("Deploying DIAPushOracle contract...");
        DIAPushOracle diaOracle = new DIAPushOracle(SOMNIA_DIA_PUSH_ORACLE);
        
        console.log("DIAPushOracle deployed at:", address(diaOracle));
        console.log("Owner:", diaOracle.owner());
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        console.log("=== Deployment Complete ===");
        console.log("Contract Address:", address(diaOracle));
    }
}