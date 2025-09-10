// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

// Uniswap V4 imports
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";
import {StateLibrary} from "lib/v4-core/src/libraries/StateLibrary.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "lib/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "lib/v4-core/src/types/PoolId.sol";

contract TestSwap is Test {
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    // Contracts
    IPoolManager public poolManager;

    // Tokens
    IERC20 public weth;
    IERC20 public aot;

    // PoolKey
    PoolKey public poolKey;
    PoolId public poolId;

    // Addresses (replace with real deployments)
    address constant POOLMANAGER_ADDR = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant WETH_ADDR = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant AOT_ADDR = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

    function setUp() public {
        poolManager = IPoolManager(POOLMANAGER_ADDR);

        weth = IERC20(WETH_ADDR);
        aot = IERC20(AOT_ADDR);

        // Construct PoolKey
        Currency wethCurrency = Currency.wrap(WETH_ADDR);
        Currency aotCurrency = Currency.wrap(AOT_ADDR);

        poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        poolId = poolKey.toId();

        // Deal tokens for testing
        deal(WETH_ADDR, address(this), 10 ether);
        deal(AOT_ADDR, address(this), 10000 ether);
    }

    function testPoolExists() public view {
        // Test that the pool exists and has been initialized
        // This test verifies the pool can be queried without reverting
        (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee) = poolManager.getSlot0(poolId);

        // Basic sanity checks
        assertTrue(sqrtPriceX96 > 0, "Pool should have a valid price");
        console.log("Pool sqrt price:", sqrtPriceX96);
        console.log("Current tick:", vm.toString(tick));
        console.log("Protocol fee:", protocolFee);
        console.log("LP fee:", lpFee);
    }

    function testPoolLiquidity() public view {
        // Test that the pool has liquidity
        uint128 liquidity = poolManager.getLiquidity(poolId);
        console.log("Pool liquidity:", liquidity);

        // Note: Liquidity might be 0 if no positions are minted yet
        // This test just ensures the call doesn't revert
    }
}
