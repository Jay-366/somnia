// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import "src/ERC20Token.sol";

contract DeployERC20Token is Script {
    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_KEY"));

        // Start broadcasting the deployment transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MyToken with 1,000,000 initial supply
        ERC20Token token = new ERC20Token(1_000_000);

        vm.stopBroadcast();

        console.log("ERC20Token deployed at:", address(token));
    }
}
