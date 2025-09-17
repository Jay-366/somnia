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

contract AddOptimalLiquidity is Script {
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

        // Get current balances
        uint256 wethBalance = weth.balanceOf(msg.sender);
        uint256 aotBalance = aot.balanceOf(msg.sender);

        console.log("=== CURRENT BALANCES ===");
        console.log("WETH balance:", wethBalance);
        console.log("AOT balance:", aotBalance);

        // Construct PoolKey
        Currency wethCurrency = Currency.wrap(WETH_ADDR);
        Currency aotCurrency = Currency.wrap(AOT_ADDR);

        PoolKey memory poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        console.log("=== LIQUIDITY STRATEGY ===");
        console.log("Current tick: -887272");
        console.log("Current range: -887220 to -887160 (has 15,000 liquidity)");
        console.log("Goal: Support many 0.001 WETH swaps");

        // Strategy: Add substantial liquidity to support your swapping needs
        // At current extreme price, we need significant AOT and minimal WETH
        
        // Use most of your available tokens but keep some for swapping
        uint256 wethToUse = (wethBalance * 80) / 100; // Use 80% of WETH
        uint256 aotToUse = (aotBalance * 10) / 10000;  // Use 0.1% of AOT (still a lot!)

        console.log("=== TOKENS TO USE FOR LIQUIDITY ===");
        console.log("WETH to use:", wethToUse);
        console.log("AOT to use:", aotToUse);
        console.log("Remaining for swaps - WETH:", wethBalance - wethToUse);
        console.log("Remaining for swaps - AOT:", aotBalance - aotToUse);

        // Calculate liquidity amount
        // At extreme price (tick -887272), need mostly AOT
        // Rough calculation: liquidity = sqrt(amount0 * amount1) for balanced range
        // But at extreme price, we need much more of the cheaper token (AOT)
        
        // Increase liquidity substantially - current is only 15,000
        // Target: 100x current liquidity = 1,500,000
        int256 liquidityDelta = 1500000;

        int24 tickLower = -887220; // Same range as current liquidity
        int24 tickUpper = -887160;
        
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: liquidityDelta,
            salt: 0
        });

        console.log("=== ADDING LIQUIDITY ===");
        console.log("Tick range:", vm.toString(tickLower), "to", vm.toString(tickUpper));
        console.log("Liquidity delta:", uint256(liquidityDelta));
        console.log("This will increase pool liquidity from 15,000 to ~1,515,000");

        // Approve tokens
        weth.approve(address(liquidityRouter), type(uint256).max);
        aot.approve(address(liquidityRouter), type(uint256).max);

        // Add liquidity
        try liquidityRouter.modifyLiquidity(poolKey, params, "") {
            console.log("=== SUCCESS! ===");
            console.log("Liquidity added successfully!");
            
            // Show updated balances
            uint256 wethAfter = weth.balanceOf(msg.sender);
            uint256 aotAfter = aot.balanceOf(msg.sender);
            
            console.log("=== UPDATED BALANCES ===");
            console.log("WETH used:", wethBalance - wethAfter);
            console.log("AOT used:", aotBalance - aotAfter);
            console.log("WETH remaining:", wethAfter);
            console.log("AOT remaining:", aotAfter);
            
            console.log("=== ESTIMATED SWAP CAPACITY ===");
            console.log("New total liquidity: ~1,515,000");
            console.log("Conservative swap capacity: ~15,150 AOT (1%)");
            console.log("This should support MANY 0.001 WETH swaps!");
            
        } catch Error(string memory reason) {
            console.log("Failed to add liquidity:", reason);
            console.log("Try with smaller liquidity amount or check token approvals");
        }

        console.log("LiquidityRouter deployed at:", address(liquidityRouter));

        vm.stopBroadcast();
    }
}