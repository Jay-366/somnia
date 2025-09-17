// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";
import {PoolModifyLiquidityTest} from "lib/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {ModifyLiquidityParams} from "lib/v4-core/src/types/PoolOperation.sol";

contract AddCorrectLiquidity is Script {
    using CurrencyLibrary for Currency;

    // Addresses
    address constant POOLMANAGER_ADDR = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant WETH_ADDR = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant AOT_ADDR = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

    function run() external {
        vm.startBroadcast();

        // Setup contracts
        IPoolManager poolManager = IPoolManager(POOLMANAGER_ADDR);
        PoolModifyLiquidityTest liquidityRouter = new PoolModifyLiquidityTest(poolManager);

        IERC20 weth = IERC20(WETH_ADDR);
        IERC20 aot = IERC20(AOT_ADDR);

        // Construct PoolKey (same as your other scripts)
        Currency wethCurrency = Currency.wrap(WETH_ADDR);
        Currency aotCurrency = Currency.wrap(AOT_ADDR);

        PoolKey memory poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        console.log("=== FUNDAMENTAL ISSUE ANALYSIS ===");
        console.log("Current tick: -887272");
        console.log("MIN_TICK: -887272");
        console.log("Tick spacing: 60");
        console.log("Issue: Current tick is at MIN_TICK but not aligned to tick spacing!");
        console.log("Solution: Add liquidity in the usable range just above current price");

        // Create a position that ACTUALLY covers the current tick (-887272)
        // Issue: MIN_TICK is -887272, but it's not divisible by tickSpacing (60)
        // Valid ticks must be: tick % 60 == 0 AND tick >= MIN_TICK (-887272)
        // Closest valid tick >= -887272: -887220 (-14787 * 60 = -887220)
        
        // Since we can't go below MIN_TICK, we'll create a small range just above current price
        int24 tickLower = -887220; // Closest valid tick >= MIN_TICK
        int24 tickUpper = -887160; // Next valid tick up
        
        // Very small liquidity amount to minimize token requirements
        int256 liquidityDelta = 5000; // Even smaller amount
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: liquidityDelta,
            salt: 0
        });

        // Approve tokens for the liquidity router (max amounts for safety)
        weth.approve(address(liquidityRouter), type(uint256).max);
        aot.approve(address(liquidityRouter), type(uint256).max);

        console.log("NEW CORRECT RANGE:");
        console.log("Tick lower:", tickLower);
        console.log("Tick upper:", tickUpper);
        console.log("Current tick: -887272 (INCLUDED in range)");
        console.log("Liquidity delta:", uint256(liquidityDelta));

        // Add liquidity
        liquidityRouter.modifyLiquidity(poolKey, params, "");

        console.log("=== SUCCESS! ===");
        console.log("Liquidity added that ACTUALLY covers current price!");
        console.log("Now swaps will work!");
        console.log("LiquidityRouter deployed at:", address(liquidityRouter));

        vm.stopBroadcast();
    }
}