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

contract MovePriceIntoRange is Script {
    using CurrencyLibrary for Currency;

    // Addresses
    address constant POOLMANAGER_ADDR = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
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

        console.log("=== MOVING PRICE INTO LIQUIDITY RANGE ===");
        console.log("Current tick: -887272");
        console.log("Our liquidity range: -887220 to -887160");
        console.log("Strategy: Swap WETH -> AOT to push price UP into range");

        // Small amount to move price - we want to move price from -887272 to around -887200
        uint256 amountIn = 0.001 ether; // Very small WETH amount

        // Approve the swap router
        weth.approve(address(swapRouter), amountIn);

        // WETH -> AOT swap (this pushes price UP/RIGHT, towards higher ticks)
        bool zeroForOne = Currency.wrap(WETH_ADDR) == poolKey.currency0;

        SwapParams memory params = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(amountIn), // negative for exact input
            sqrtPriceLimitX96: zeroForOne
                ? 4295128740 + 1000 // Slightly higher than current price
                : 1461446703485210103287273052203988822378723970341 // MAX_SQRT_RATIO - 1
        });

        PoolSwapTest.TestSettings memory testSettings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        console.log("Attempting to swap", amountIn, "WETH for AOT...");

        try swapRouter.swap(poolKey, params, testSettings, "") {
            console.log("=== SUCCESS! ===");
            console.log("Price moved into liquidity range!");
            console.log("You can now perform AOT -> WETH swaps!");
        } catch Error(string memory reason) {
            console.log("Swap failed:", reason);
            console.log("This might be expected if price is still outside range");
        } catch {
            console.log("Swap failed with unknown error");
            console.log("Price might still be outside liquidity range");
        }

        console.log("SwapRouter deployed at:", address(swapRouter));

        vm.stopBroadcast();
    }
}