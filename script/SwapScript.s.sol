// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";
import {PoolSwapTest} from "lib/v4-core/src/test/PoolSwapTest.sol";
import {SwapParams} from "lib/v4-core/src/types/PoolOperation.sol";

contract SwapScript is Script {
    using CurrencyLibrary for Currency;

    // Addresses - using your latest deployed contracts
    address constant POOLMANAGER_ADDR =
        0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant WETH_ADDR = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant AOT_ADDR = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

    function run() external {
        vm.startBroadcast();

        // Setup contracts
        IPoolManager poolManager = IPoolManager(POOLMANAGER_ADDR);
        PoolSwapTest swapRouter = new PoolSwapTest(poolManager);

        IERC20 weth = IERC20(WETH_ADDR);
        IERC20 aot = IERC20(AOT_ADDR);

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

        uint256 amountIn = 0.001 ether; // Swap 0.01 WETH

        // Get initial balances
        uint256 wethBalanceBefore = weth.balanceOf(msg.sender);
        uint256 aotBalanceBefore = aot.balanceOf(msg.sender);

        console.log("=== BEFORE SWAP ===");
        console.log("WETH balance:", wethBalanceBefore);
        console.log("AOT balance:", aotBalanceBefore);
        console.log("Swapping:", amountIn, "WETH for AOT");

        // Approve the swap router
        weth.approve(address(swapRouter), amountIn);

        // Determine swap direction
        bool zeroForOne = Currency.wrap(WETH_ADDR) == poolKey.currency0;

        // Perform swap - using TickMath bounds for price limits
        SwapParams memory params = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(amountIn), // negative for exact input
            sqrtPriceLimitX96: zeroForOne 
                ? 4295128740 // MIN_SQRT_RATIO + 1
                : 1461446703485210103287273052203988822378723970341 // MAX_SQRT_RATIO - 1
        });

        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest
            .TestSettings({takeClaims: false, settleUsingBurn: false});

        // Execute the swap
        swapRouter.swap(poolKey, params, testSettings, "");

        // Check final balances
        uint256 wethBalanceAfter = weth.balanceOf(msg.sender);
        uint256 aotBalanceAfter = aot.balanceOf(msg.sender);

        console.log("=== AFTER SWAP ===");
        console.log("WETH balance:", wethBalanceAfter);
        console.log("AOT balance:", aotBalanceAfter);

        // Calculate amounts
        uint256 wethUsed = wethBalanceBefore - wethBalanceAfter;
        uint256 aotReceived = aotBalanceAfter - aotBalanceBefore;

        console.log("=== SWAP RESULTS ===");
        console.log("WETH used:", wethUsed);
        console.log("AOT received:", aotReceived);

        if (aotReceived > 0 && wethUsed > 0) {
            uint256 exchangeRate = (aotReceived * 1e18) / wethUsed;
            console.log("Exchange rate: 1 WETH =", exchangeRate, "AOT");
        }

        console.log("Swap completed successfully!");
        console.log("SwapRouter deployed at:", address(swapRouter));

        vm.stopBroadcast();
    }
}
