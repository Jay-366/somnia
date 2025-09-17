// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IPositionManager} from "lib/v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "lib/v4-periphery/src/libraries/Actions.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";
import {IERC20Minimal as IERC20} from "lib/v4-core/src/interfaces/external/IERC20Minimal.sol";
import {IAllowanceTransfer} from "lib/permit2/src/interfaces/IAllowanceTransfer.sol";
import {IWETH9} from "lib/v4-periphery/src/interfaces/external/IWETH9.sol";

contract CreatePositionScript is Script {
    using CurrencyLibrary for Currency;

    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant POSM = 0x5de19fE5E05fD56882ACd533cE303def8c5C5705;

    function run() external payable {
        vm.startBroadcast();

        // Token addresses
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address aot = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

        IPositionManager posm = IPositionManager(POSM);

        Currency wethCurrency = Currency.wrap(weth);
        Currency aotCurrency = Currency.wrap(aot);

        // Approve Permit2
        IERC20(weth).approve(PERMIT2, type(uint256).max);
        IERC20(aot).approve(PERMIT2, type(uint256).max);
        IAllowanceTransfer(PERMIT2).approve(weth, POSM, type(uint160).max, uint48(block.timestamp + 30 days));
        IAllowanceTransfer(PERMIT2).approve(aot, POSM, type(uint160).max, uint48(block.timestamp + 30 days));

        // Pool configuration
        PoolKey memory pool = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        // Create new position covering current tick with wider range
        // Valid tick range is MIN_TICK (-887272) to MAX_TICK (+887272)
        // Ticks must be divisible by tickSpacing (60)
        int24 tickLower = -887220;  // Valid tick within bounds
        int24 tickUpper = -886800;  // Valid tick within bounds
        uint256 liquidityToAdd = 100000;    // Even smaller liquidity amount
        uint128 amount0Max = 0.01 ether;    // max WETH
        uint128 amount1Max = 100 ether;     // max AOT
        bytes memory hookData = bytes("");

        // Encode actions
        bytes memory actions = abi.encodePacked(
            uint8(Actions.MINT_POSITION), 
            uint8(Actions.SETTLE_PAIR)
        );

        bytes[] memory params = new bytes[](2);

        // MINT_POSITION parameters
        params[0] = abi.encode(
            pool,          // PoolKey struct
            tickLower,
            tickUpper,
            liquidityToAdd,
            amount0Max,
            amount1Max,
            msg.sender,    // owner
            hookData
        );

        // SETTLE_PAIR parameters
        params[1] = abi.encode(pool.currency0, pool.currency1);

        uint256 deadline = block.timestamp + 120;

        posm.modifyLiquidities(abi.encode(actions, params), deadline);

        vm.stopBroadcast();
    }
}
