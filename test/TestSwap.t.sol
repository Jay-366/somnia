// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

// Uniswap imports
import { UniversalRouter } from "lib/universal-router/contracts/UniversalRouter.sol";
import { Commands } from "lib/universal-router/contracts/libraries/Commands.sol";
import { IPoolManager } from "lib/v4-core/src/interfaces/IPoolManager.sol";
import { IV4Router } from "lib/v4-periphery/src/interfaces/IV4Router.sol";
import { Actions } from "lib/v4-periphery/src/libraries/Actions.sol";
import { IPermit2 } from "lib/permit2/src/interfaces/IPermit2.sol";
import { StateLibrary } from "lib/v4-core/src/libraries/StateLibrary.sol";
import { IHooks } from "lib/v4-core/src/interfaces/IHooks.sol";
import { PoolKey } from "lib/v4-core/src/types/PoolKey.sol";
import { Currency, CurrencyLibrary } from "lib/v4-core/src/types/Currency.sol";

contract TestSwap is Test {
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;

    // Contracts
    UniversalRouter public router;
    IPoolManager public poolManager;
    IPermit2 public permit2;

    // Tokens
    IERC20 public weth;
    IERC20 public aot;

    // PoolKey
    PoolKey public poolKey;

    // Addresses (replace with real deployments)
    address constant ROUTER_ADDR = 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD;      
    address constant POOLMANAGER_ADDR = 0xC615726d806bb7d5516609940249B2a13F8CC509;
    address constant PERMIT2_ADDR     = 0x000000000022d473030f116ddee9f6b43ac78ba3;
    address constant WETH_ADDR        = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant AOT_ADDR         = 0xD98f9971773045735C62cD8f1a70047f81b9a468;

    function setUp() public {
        router = UniversalRouter(payable(ROUTER_ADDR));
        poolManager = IPoolManager(POOLMANAGER_ADDR);
        permit2 = IPermit2(PERMIT2_ADDR);

        weth = IERC20(WETH_ADDR);
        aot = IERC20(AOT_ADDR);

        // Construct PoolKey
        Currency wethCurrency = Currency.wrap(WETH_ADDR);
        Currency aotCurrency  = Currency.wrap(AOT_ADDR);

        poolKey = PoolKey({
            currency0: wethCurrency < aotCurrency ? wethCurrency : aotCurrency,
            currency1: wethCurrency < aotCurrency ? aotCurrency : wethCurrency,
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        // Deal tokens for testing
        deal(WETH_ADDR, address(this), 10 ether);
        deal(AOT_ADDR, address(this), 10000 ether);
    }

    /// @notice Approve Permit2 + Router to spend tokenIn
    function _approveToken(address token, uint160 amount, uint48 expiration) internal {
        IERC20(token).approve(address(permit2), type(uint256).max);
        permit2.approve(token, address(router), amount, expiration);
    }

    function testSwapWethToAot() public {
        uint128 amountIn = 0.01 ether;
        uint128 minOut = 0.01 ether; // Expecting roughly 1:1 ratio, adjust based on actual pool price

        _approveToken(WETH_ADDR, type(uint160).max, uint48(block.timestamp + 3600));

        // Step 1: Command
        bytes memory commands = abi.encodePacked(uint8(Commands.V4_SWAP));

        // Step 2: Actions
        bytes memory actions = abi.encodePacked(
            uint8(Actions.SWAP_EXACT_IN_SINGLE),
            uint8(Actions.SETTLE_ALL),
            uint8(Actions.TAKE_ALL)
        );

        // Step 3: Params
        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(
            IV4Router.ExactInputSingleParams({
                poolKey: poolKey,
                zeroForOne: true,
                amountIn: amountIn,
                amountOutMinimum: minOut,
                hookData: bytes("")
            })
        );
        params[1] = abi.encode(poolKey.currency0, amountIn);
        params[2] = abi.encode(poolKey.currency1, minOut);

        // Step 4: Combine into inputs
        bytes[] memory inputs = new bytes[](1);
        inputs[0] = abi.encode(actions, params);

        // Step 5: Execute swap
        uint256 deadline = block.timestamp + 20;
        router.execute(commands, inputs, deadline);

        // Step 6: Assert output
        uint256 outBalance = IERC20(Currency.unwrap(poolKey.currency1)).balanceOf(address(this));
        assertGe(outBalance, minOut, "Insufficient output from swap");
    }
}
