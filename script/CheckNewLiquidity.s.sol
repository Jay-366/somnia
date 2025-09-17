// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IStateView} from "lib/v4-periphery/src/interfaces/IStateView.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "lib/v4-core/src/types/PoolId.sol";
import {Currency} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";

contract CheckNewLiquidity is Script {
    using PoolIdLibrary for PoolKey;

    address constant STATE_VIEW = 0xE1Dd9c3fA50EDB962E442f60DfBc432e24537E4C;

    function run() external view {
        // Initialize pool configuration
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address aot = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

        Currency wethCurrency = Currency.wrap(weth);
        Currency aotCurrency = Currency.wrap(aot);

        PoolKey memory poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        PoolId poolId = poolKey.toId();
        IStateView stateView = IStateView(STATE_VIEW);

        console.log("=== CHECKING NEW LIQUIDITY RANGE ===");
        console.log("Current tick: -887272");
        console.log("Our liquidity range: -887220 to -887160");
        console.log("");

        // Check our new liquidity range
        _checkTickRange(stateView, poolId, -887220, -887160);
        
        // Also check some adjacent ticks
        console.log("=== ADJACENT TICKS ===");
        _checkSingleTick(stateView, poolId, -887280);
        _checkSingleTick(stateView, poolId, -887220);
        _checkSingleTick(stateView, poolId, -887160);
        _checkSingleTick(stateView, poolId, -887100);

        // Get current liquidity at current tick
        try stateView.getLiquidity(poolId) returns (uint128 totalLiquidity) {
            console.log("=== TOTAL POOL LIQUIDITY ===");
            console.log("Total liquidity at current tick:", totalLiquidity);
            
            if (totalLiquidity > 0) {
                console.log("=== ESTIMATED SWAP CAPACITY ===");
                _estimateSwapCapacity(totalLiquidity);
            } else {
                console.log("Warning: No liquidity at current tick!");
            }
        } catch {
            console.log("Could not fetch total liquidity");
        }
    }

    function _checkTickRange(IStateView stateView, PoolId poolId, int24 tickLower, int24 tickUpper) internal view {
        console.log("=== LIQUIDITY IN RANGE ===");
        console.log("Tick Lower:", vm.toString(tickLower));
        console.log("Tick Upper:", vm.toString(tickUpper));
        
        try stateView.getFeeGrowthInside(poolId, tickLower, tickUpper) returns (
            uint256 feeGrowthInside0X128, uint256 feeGrowthInside1X128
        ) {
            console.log("Fee growth inside 0:", feeGrowthInside0X128);
            console.log("Fee growth inside 1:", feeGrowthInside1X128);
            console.log("Range has activity: YES");
        } catch {
            console.log("Range has activity: NO");
        }
    }

    function _checkSingleTick(IStateView stateView, PoolId poolId, int24 tick) internal view {
        try stateView.getTickInfo(poolId, tick) returns (
            uint128 liquidityGross,
            int128 liquidityNet,
            uint256 feeGrowthOutside0X128,
            uint256 feeGrowthOutside1X128
        ) {
            console.log("Tick", vm.toString(tick), ":");
            console.log("  Liquidity Gross:", liquidityGross);
            console.log("  Liquidity Net:", vm.toString(liquidityNet));
        } catch {
            console.log("Tick", vm.toString(tick), ": No data");
        }
    }

    function _estimateSwapCapacity(uint128 totalLiquidity) internal view {
        console.log("Based on liquidity:", totalLiquidity);
        
        // Rough estimates based on concentrated liquidity mechanics
        // These are approximations - actual capacity depends on price impact
        
        uint256 liquidity = uint256(totalLiquidity);
        
        // Very rough estimate: in a tight range, you can usually swap
        // about 1-5% of liquidity before significant price impact
        
        uint256 conservative_capacity = liquidity / 100; // 1%
        uint256 moderate_capacity = liquidity / 50;      // 2%
        uint256 aggressive_capacity = liquidity / 20;    // 5%
        
        console.log("=== ESTIMATED SWAP CAPACITY (AOT to WETH) ===");
        console.log("Conservative (1%):", conservative_capacity, "AOT");
        console.log("Moderate (2%):", moderate_capacity, "AOT");
        console.log("Aggressive (5%):", aggressive_capacity, "AOT");
        console.log("");
        
        // Convert to number of swaps
        uint256 swaps_001 = conservative_capacity / 1e15; // 0.001 AOT swaps
        uint256 swaps_01 = conservative_capacity / 1e16;  // 0.01 AOT swaps  
        uint256 swaps_1 = conservative_capacity / 1e17;   // 0.1 AOT swaps
        
        console.log("=== ESTIMATED NUMBER OF SWAPS (Conservative) ===");
        console.log("0.001 AOT swaps:", swaps_001);
        console.log("0.01 AOT swaps:", swaps_01);
        console.log("0.1 AOT swaps:", swaps_1);
    }
}