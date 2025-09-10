// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Script.sol";
import {PositionManager} from "lib/v4-periphery/src/PositionManager.sol";
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";
import {IAllowanceTransfer} from "lib/permit2/src/interfaces/IAllowanceTransfer.sol";
import {IPositionDescriptor} from "lib/v4-periphery/src/interfaces/IPositionDescriptor.sol";
import {IWETH9} from "lib/v4-periphery/src/interfaces/external/IWETH9.sol";

contract DeployPositionManagerScript is Script {
    function run() external {
        vm.startBroadcast();

        IPoolManager poolManager = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
        IAllowanceTransfer permit2 = IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3);
        IPositionDescriptor tokenDescriptor = IPositionDescriptor(0xC7f2Cf4845C6db0e1a1e91ED41Bcd0FcC1b0E141);
        IWETH9 weth9 = IWETH9(0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14);

        PositionManager posm = new PositionManager(poolManager, permit2, 500_000, tokenDescriptor, weth9);

        console.log("PositionManager deployed at:", address(posm));

        vm.stopBroadcast();
    }
}
