// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";

interface IWETH {
    function deposit() external payable;
    function balanceOf(address account) external view returns (uint256);
}

contract WrapETH is Script {
    // Sepolia WETH address
    address constant WETH_ADDRESS = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_KEY"));

        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        IWETH weth = IWETH(WETH_ADDRESS);

        // Amount of ETH to wrap (in wei)
        uint256 amountToWrap = 0.1 ether;

        // Call deposit() and send ETH
        weth.deposit{value: amountToWrap}();

        // Check balance
        uint256 wethBalance = weth.balanceOf(msg.sender);
        console.log("Your WETH balance:", wethBalance);

        vm.stopBroadcast();
    }
}
