// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";

contract InitializePoolScript is Script {
    function run() external {
        // Start broadcasting in Foundry
        vm.startBroadcast();

        // Replace these addresses with your actual deployed contracts
        address poolManagerAddress = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address aot = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

        IPoolManager poolManager = IPoolManager(poolManagerAddress);

        // Wrap addresses as Currency
        // Wrap addresses as Currency
        Currency wethCurrency = Currency.wrap(weth);
        Currency aotCurrency = Currency.wrap(aot);

        // Configure the pool
        PoolKey memory pool = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000, // 0.30% pool fee
            tickSpacing: 60, // example tick spacing
            hooks: IHooks(address(0)) // optional hook
        });

        uint160 startingPrice = 79228162514264337593543950336; // 1:1 price

        // Initialize the pool
        int24 tick = poolManager.initialize(pool, startingPrice);

        // Compute poolId
        bytes32 poolId = keccak256(abi.encode(pool.currency0, pool.currency1, pool.fee, pool.tickSpacing, pool.hooks));

        // Log it
        console.logBytes32(poolId);
        console.log("Pool initialized at tick:", tick);

        vm.stopBroadcast();
    }
}
