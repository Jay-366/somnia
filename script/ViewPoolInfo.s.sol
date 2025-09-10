// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IStateView} from "lib/v4-periphery/src/interfaces/IStateView.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "lib/v4-core/src/types/PoolId.sol";
import {Currency} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";

contract ViewPoolInfo is Script {
    using PoolIdLibrary for PoolKey;

    // StateView contract address (you'll need to deploy this or use existing one)
    address constant STATE_VIEW = 0xE1Dd9c3fA50EDB962E442f60DfBc432e24537E4C; // Replace with actual StateView address
    
    // Pool configuration
    PoolKey public poolKey;
    PoolId public poolId;
    
    function run() external {
        // Initialize pool configuration
        _initializePoolKey();
        
        console.log("=== UNISWAP V4 POOL INFORMATION ===");
        console.log("Pool ID:", vm.toString(PoolId.unwrap(poolId)));
        console.log("");
        
        // 1. Pool Health & Swap Limits
        _getPoolHealthInfo();
        
        // 2. Fee Information
        _getFeeInfo();
        
        // 3. Tick Information
        _getTickInfo();
        
        // 4. Position Information (example position)
        _getPositionInfo();
    }
    
    function _initializePoolKey() internal {
        // WETH/AOT pool configuration
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address aot = 0xD98f9971773045735C62cD8f1a70047f81b9a468;
        
        Currency wethCurrency = Currency.wrap(weth);
        Currency aotCurrency = Currency.wrap(aot);
        
        poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });
        
        poolId = poolKey.toId();
    }
    
    function _getPoolHealthInfo() internal view {
        console.log("=== POOL HEALTH & SWAP LIMITS ===");
        
        IStateView stateView = IStateView(STATE_VIEW);
        
        // Get Slot0 - contains current price, tick, and protocol fees
        try stateView.getSlot0(poolId) returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint24 protocolFee,
            uint24 lpFee
        ) {
            console.log("Current sqrt price X96:", sqrtPriceX96);
            console.log("Current tick:", vm.toString(tick));
            console.log("Protocol fee:", protocolFee);
            console.log("LP fee:", lpFee);
        } catch {
            console.log("Error: Could not fetch Slot0 data");
        }
        
        // Get total liquidity
        try stateView.getLiquidity(poolId) returns (uint128 liquidity) {
            console.log("Total liquidity:", liquidity);
        } catch {
            console.log("Error: Could not fetch liquidity data");
        }
        
        console.log("");
    }
    
    function _getFeeInfo() internal view {
        console.log("=== FEE INFORMATION ===");
        
        IStateView stateView = IStateView(STATE_VIEW);
        
        // Get global fee growth
        try stateView.getFeeGrowthGlobals(poolId) returns (
            uint256 feeGrowthGlobal0X128,
            uint256 feeGrowthGlobal1X128
        ) {
            console.log("Global fee growth token0:", feeGrowthGlobal0X128);
            console.log("Global fee growth token1:", feeGrowthGlobal1X128);
        } catch {
            console.log("Error: Could not fetch global fee growth");
        }
        
        // Get fee growth inside a specific tick range (example: -120 to 120)
        int24 tickLower = -120;
        int24 tickUpper = 120;
        
        try stateView.getFeeGrowthInside(poolId, tickLower, tickUpper) returns (
            uint256 feeGrowthInside0X128,
            uint256 feeGrowthInside1X128
        ) {
            console.log("Fee growth inside (-120, 120) token0:", feeGrowthInside0X128);
            console.log("Fee growth inside (-120, 120) token1:", feeGrowthInside1X128);
        } catch {
            console.log("Error: Could not fetch fee growth inside range");
        }
        
        console.log("");
    }
    
    function _getTickInfo() internal view {
        console.log("=== TICK INFORMATION ===");
        
        IStateView stateView = IStateView(STATE_VIEW);
        
        // Check tick info for common tick ranges
        int24[] memory ticksToCheck = new int24[](5);
        ticksToCheck[0] = -120;
        ticksToCheck[1] = -60;
        ticksToCheck[2] = 0;
        ticksToCheck[3] = 60;
        ticksToCheck[4] = 120;
        
        for (uint i = 0; i < ticksToCheck.length; i++) {
            int24 tick = ticksToCheck[i];
            
            try stateView.getTickInfo(poolId, tick) returns (
                uint128 liquidityGross,
                int128 liquidityNet,
                uint256 feeGrowthOutside0X128,
                uint256 feeGrowthOutside1X128
            ) {
                console.log("Tick:", vm.toString(tick));
                console.log("  Liquidity Gross:", liquidityGross);
                console.log("  Liquidity Net:", vm.toString(liquidityNet));
                console.log("  Fee Growth Outside 0:", feeGrowthOutside0X128);
                console.log("  Fee Growth Outside 1:", feeGrowthOutside1X128);
            } catch {
                console.log("Tick:", vm.toString(tick), "- No liquidity");
            }
        }
        
        console.log("");
    }
    
    function _getPositionInfo() internal view {
        console.log("=== POSITION INFORMATION ===");
        
        IStateView stateView = IStateView(STATE_VIEW);
        
        // Example position parameters (adjust based on your actual positions)
        address owner = 0x3324533837E165829b8E581B4F471125C9D8C66A; // Your address
        int24 tickLower = -120;
        int24 tickUpper = 120;
        bytes32 salt = bytes32(uint256(1)); // Default salt used by PositionManager
        
        try stateView.getPositionInfo(poolId, owner, tickLower, tickUpper, salt) returns (
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128
        ) {
            console.log("Position Owner:", owner);
            console.log("Tick Range:", vm.toString(tickLower), "to", vm.toString(tickUpper));
            console.log("Position Liquidity:", liquidity);
            console.log("Fee Growth Inside 0 Last:", feeGrowthInside0LastX128);
            console.log("Fee Growth Inside 1 Last:", feeGrowthInside1LastX128);
        } catch {
            console.log("No position found for owner:", owner);
            console.log("Tick range:", vm.toString(tickLower), "to", vm.toString(tickUpper));
        }
        
        // Alternative: Get position liquidity only (requires positionId)
        bytes32 positionId = keccak256(abi.encodePacked(owner, tickLower, tickUpper, salt));
        try stateView.getPositionLiquidity(poolId, positionId) returns (
            uint128 liquidity
        ) {
            console.log("Position Liquidity (alternative method):", liquidity);
        } catch {
            console.log("Could not fetch position liquidity");
        }
        
        console.log("");
    }
    
    // Helper function to convert sqrt price to human readable price
    function _sqrtPriceToPrice(uint160 sqrtPriceX96) internal pure returns (uint256) {
        // Price = (sqrtPriceX96 / 2^96)^2
        // This is a simplified calculation - in production you'd want more precision
        uint256 price = (uint256(sqrtPriceX96) * uint256(sqrtPriceX96)) >> 192;
        return price;
    }
}