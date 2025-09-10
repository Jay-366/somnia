// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ApproveAllTokens is Script {
    // Example token addresses on Sepolia
    address constant WETH_ADDRESS = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant DAI_ADDRESS = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

    // Spender (e.g., Uniswap V4 Position Manager)
    address constant SPENDER = 0x5de19fE5E05fD56882ACd533cE303def8c5C5705;

    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_KEY"));

        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        // Approve max for WETH
        IERC20 weth = IERC20(WETH_ADDRESS);
        weth.approve(SPENDER, type(uint256).max);
        console.log("Approved WETH for spender");

        // Approve max for DAI
        IERC20 dai = IERC20(DAI_ADDRESS);
        dai.approve(SPENDER, type(uint256).max);
        console.log("Approved DAI for spender");

        vm.stopBroadcast();
    }
}
