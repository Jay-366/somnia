// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../contracts/Escrow.sol";

contract DeployEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address sttTokenAddress = vm.envAddress("STT_TOKEN_ADDRESS");
        
        console.log("Deploying Escrow contract...");
        console.log("Network: Somnia Testnet");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("STT Token:", sttTokenAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Escrow contract
        Escrow escrow = new Escrow(sttTokenAddress);
        
        console.log("========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("========================================");
        console.log("Escrow Contract Address:", address(escrow));
        console.log("STT Token Address:", sttTokenAddress);
        console.log("Admin/Owner:", vm.addr(deployerPrivateKey));
        console.log("========================================");
        console.log("Add to .env:");
        console.log("NEXT_PUBLIC_ESCROW_ADDRESS=", address(escrow));
        console.log("========================================");
        
        vm.stopBroadcast();
    }
}