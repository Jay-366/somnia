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

contract IncreaseLiquidityScript is Script {
    using CurrencyLibrary for Currency;

    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant POSM = 0x5de19fE5E05fD56882ACd533cE303def8c5C5705;

    function run() external payable {
        vm.startBroadcast();

        // Give the deployer address some ETH for wrapping (simulation only)
        vm.deal(msg.sender, msg.sender.balance + 0.15 ether);

        // Token addresses
        address weth = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
        address aot = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

        IPositionManager posm = IPositionManager(POSM);

        Currency wethCurrency = Currency.wrap(weth);
        Currency aotCurrency = Currency.wrap(aot);

        // Wrap 0.1 ETH to WETH for adding liquidity
        console.log("=== WRAPPING ETH TO WETH ===");
        console.log("Wrapping 0.1 ETH to WETH...");
        IWETH9(payable(weth)).deposit{value: 0.1 ether}();
        console.log("Successfully wrapped 0.1 ETH to WETH");

        // Get current balances BEFORE
        uint256 wethBalanceBefore = IERC20(weth).balanceOf(msg.sender);
        uint256 aotBalanceBefore = IERC20(aot).balanceOf(msg.sender);

        console.log("=== BEFORE INCREASING LIQUIDITY ===");
        console.log("WETH balance:", wethBalanceBefore);
        console.log("AOT balance:", aotBalanceBefore);

        // Standard ERC20 approve - Approve Permit2 to spend tokens
        IERC20(weth).approve(PERMIT2, type(uint256).max);
        IERC20(aot).approve(PERMIT2, type(uint256).max);

        // Set Permit2 allowances
        setPermit2Allowances(weth, aot);

        // Pool configuration (same as your other scripts)
        PoolKey memory pool = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        // Position parameters for increase
        uint256 tokenId = 1; // Assuming your first position has tokenId = 1
        uint256 liquidityToAdd = 0.02 ether; // Increased liquidity amount
        uint128 amount0Max = 0.1 ether; // Max WETH willing to pay (0.1 WETH)
        uint128 amount1Max = 100 ether; // Max AOT willing to pay (proportional increase)
        bytes memory hookData = bytes("");

        console.log("=== INCREASE LIQUIDITY PARAMETERS ===");
        console.log("Token ID:", tokenId);
        console.log("Liquidity to add:", liquidityToAdd);
        console.log("Max amount0 (currency0):", amount0Max);
        console.log("Max amount1 (currency1):", amount1Max);

        // Encode actions for increasing liquidity
        bytes memory actions = abi.encodePacked(
            uint8(Actions.INCREASE_LIQUIDITY),
            uint8(Actions.SETTLE_PAIR)
        );

        // Encode parameters
        bytes[] memory params = new bytes[](2);

        // INCREASE_LIQUIDITY parameters
        params[0] = abi.encode(
            tokenId,
            liquidityToAdd,
            amount0Max,
            amount1Max,
            hookData
        );

        // SETTLE_PAIR parameters
        params[1] = abi.encode(pool.currency0, pool.currency1);

        uint256 deadline = block.timestamp + 60;

        console.log("=== EXECUTING INCREASE LIQUIDITY ===");

        // Execute the increase liquidity operation
        posm.modifyLiquidities(abi.encode(actions, params), deadline);

        // Get current balances AFTER
        uint256 wethBalanceAfter = IERC20(weth).balanceOf(msg.sender);
        uint256 aotBalanceAfter = IERC20(aot).balanceOf(msg.sender);

        console.log("=== AFTER INCREASING LIQUIDITY ===");
        console.log("WETH balance:", wethBalanceAfter);
        console.log("AOT balance:", aotBalanceAfter);

        // Calculate amounts used
        uint256 wethUsed = wethBalanceBefore - wethBalanceAfter;
        uint256 aotUsed = aotBalanceBefore - aotBalanceAfter;

        console.log("=== LIQUIDITY INCREASE RESULTS ===");
        console.log("WETH used:", wethUsed);
        console.log("AOT used:", aotUsed);
        console.log("Liquidity successfully increased!");

        vm.stopBroadcast();
    }

    function setPermit2Allowances(address weth, address aot) internal {
        IAllowanceTransfer(PERMIT2).approve(
            weth,
            POSM,
            type(uint160).max,
            uint48(block.timestamp + 30 days)
        );
        IAllowanceTransfer(PERMIT2).approve(
            aot,
            POSM,
            type(uint160).max,
            uint48(block.timestamp + 30 days)
        );
    }
}
