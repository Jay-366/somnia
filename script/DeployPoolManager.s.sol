// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "lib/forge-std/src/Script.sol";
import "lib/v4-core/src/PoolManager.sol";

contract DeployPoolManager is Script {
    function run() external {
        // Load deployer private key as bytes32
        bytes32 deployerPrivateKey = vm.envBytes32("DEPLOYER_KEY");
        address deployerAddress = vm.envAddress("DEPLOYER_ADDRESS");

        // Start broadcasting transaction
        vm.startBroadcast(uint256(deployerPrivateKey));

        PoolManager manager = new PoolManager(deployerAddress);

        vm.stopBroadcast();

        console.log("PoolManager deployed at:", address(manager));
    }
}
