
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PositionDescriptor} from "lib/v4-periphery/src/PositionDescriptor.sol";
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";

contract DeployPositionDescriptor {
    function run() external returns (PositionDescriptor) {
        IPoolManager poolManager = IPoolManager(0xC615726d806bb7d5516609940249B2a13F8CC509);
        address WETH9 = 0xdd13E55209Fd76AfE204dBda4007C227904f0a81; // Sepolia WETH
        bytes32 nativeLabel = "ETH";

        PositionDescriptor descriptor = new PositionDescriptor(
            poolManager,
            WETH9,
            nativeLabel
        );

        return descriptor;
    }
}
