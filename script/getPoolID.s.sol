// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "lib/forge-std/src/Script.sol";
import {PoolKey} from "lib/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "lib/v4-core/src/types/PoolId.sol";
import {Currency} from "lib/v4-core/src/types/Currency.sol";
import {IHooks} from "lib/v4-core/src/interfaces/IHooks.sol";

contract GetPoolIDScript is Script {
    using PoolIdLibrary for PoolKey;

    function run() external pure {
        // Example pool configuration (replace with your actual tokens)
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(
                0xD98f9971773045735C62cD8f1a70047f81b9a468
            ), // AOT
            currency1: Currency.wrap(
                0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
            ), // WETH
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(0))
        });

        PoolId poolId = poolKey.toId();
        console.log("Pool ID:", vm.toString(PoolId.unwrap(poolId)));
    }
}
