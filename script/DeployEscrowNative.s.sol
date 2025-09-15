// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../contracts/EscrowNative.sol";

contract DeployEscrowNative is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Deploying EscrowNative contract...");
        console.log("Network: Somnia Testnet");
        console.log("Native Token: STT");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy EscrowNative contract
        EscrowNative escrow = new EscrowNative();
        
        console.log("========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("========================================");
        console.log("EscrowNative Contract Address:", address(escrow));
        console.log("Native Token: STT (no contract address)");
        console.log("Admin/Owner:", vm.addr(deployerPrivateKey));
        console.log("========================================");
        console.log("Add to .env:");
        console.log("NEXT_PUBLIC_ESCROW_ADDRESS=", address(escrow));
        console.log("========================================");
        console.log("Test with STT:");
        console.log("cast send", address(escrow), "\"deposit()\" --value 1ether --rpc-url somnia");
        console.log("========================================");
        
        vm.stopBroadcast();
    }
}