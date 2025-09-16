// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import "../contracts/ExecutorVault.sol";

contract DeployExecutorVault is Script {
    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("DEPLOYING EXECUTOR VAULT TO SEPOLIA");
        console.log("===========================================");
        console.log("Deployer Address:", deployerAddress);
        console.log("Network: Sepolia Testnet");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy ExecutorVault contract
        ExecutorVault vault = new ExecutorVault();

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("===========================================");
        console.log("ExecutorVault Address:", address(vault));
        
        // Get pool info for verification
        (address currency0, address currency1, uint24 fee, int24 tickSpacing) = vault.getPoolInfo();
        console.log("Pool Currency0:", currency0);
        console.log("Pool Currency1:", currency1);
        console.log("Pool Fee:", fee);
        console.log("Pool Tick Spacing:", tickSpacing);
        
        console.log("===========================================");
        console.log("CONFIGURATION SUMMARY");
        console.log("===========================================");
        console.log("WETH Address:", vault.WETH());
        console.log("AOT Address:", vault.AOT());
        console.log("Pool Manager:", vault.POOL_MANAGER());
        console.log("Owner:", vault.owner());
        
        console.log("===========================================");
        console.log("NEXT STEPS");
        console.log("===========================================");
        console.log("1. Add to .env file:");
        console.log("   NEXT_PUBLIC_EXECUTOR_VAULT_ADDRESS=", address(vault));
        console.log("");
        console.log("2. Update frontend/lib/contracts.ts with vault address");
        console.log("");
        console.log("3. Test the deployment:");
        console.log("   forge test --match-contract ExecutorVaultTest");
        console.log("");
        console.log("4. Verify on Etherscan:");
        console.log("   forge verify-contract", address(vault), "contracts/ExecutorVault.sol:ExecutorVault --chain sepolia");
    }
}