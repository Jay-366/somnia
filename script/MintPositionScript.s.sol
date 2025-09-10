// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {IPositionManager} from "lib/v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "lib/v4-periphery/src/libraries/Actions.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";
import {IERC20Minimal as IERC20} from "lib/v4-core/src/interfaces/external/IERC20Minimal.sol";
import {IAllowanceTransfer} from "permit2/src/interfaces/IAllowanceTransfer.sol";

contract MintPositionScript is Script {
    using CurrencyLibrary for Currency;

    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant POSM = 0x5de19fE5E05fD56882ACd533cE303def8c5C5705;

    function run() external {
        vm.startBroadcast();

        // -------------------------
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address aot = 0xD98f9971773045735C62cD8f1a70047f81b9a468;
        address recipient = msg.sender;

        IPositionManager posm = IPositionManager(POSM);

        Currency wethCurrency = Currency.wrap(weth);
        Currency aotCurrency = Currency.wrap(aot);

        // -------------------------
        // Standard ERC20 approve - Approve Permit2 to spend tokens
        IERC20(weth).approve(PERMIT2, type(uint256).max);
        IERC20(aot).approve(PERMIT2, type(uint256).max);

        // -------------------------
        // Set Permit2 allowances to avoid AllowanceExpired errors
        setPermit2Allowances(weth, aot);

        // -------------------------
        PoolKey memory pool = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        int24 tickLower = -120;
        int24 tickUpper = 120;
        uint256 liquidity = 0.002 ether;
        uint128 amount0Max = 0.02 ether;
        uint128 amount1Max = 20 ether;
        bytes memory hookData = bytes("");

        bytes memory actions = abi.encodePacked(uint8(Actions.MINT_POSITION), uint8(Actions.SETTLE_PAIR));

        bytes[] memory params = new bytes[](2);

        params[0] = abi.encode(pool, tickLower, tickUpper, liquidity, amount0Max, amount1Max, recipient, hookData);
        params[1] = abi.encode(pool.currency0, pool.currency1);

        uint256 deadline = block.timestamp + 60;

        posm.modifyLiquidities(abi.encode(actions, params), deadline);

        console.log("Liquidity position minted successfully!");

        vm.stopBroadcast();
    }

    function setPermit2Allowances(address weth, address aot) internal {
        IAllowanceTransfer(PERMIT2).approve(weth, POSM, type(uint160).max, uint48(block.timestamp + 30 days));
        IAllowanceTransfer(PERMIT2).approve(aot, POSM, type(uint160).max, uint48(block.timestamp + 30 days));
    }
}
