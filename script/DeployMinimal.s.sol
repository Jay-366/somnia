// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/DIAPushOracleMinimal.sol";

contract DeployMinimal is Script {
    
    address constant SOMNIA_DIA_PUSH_ORACLE = 0xFb1462A649A92654482F8E048C754333ad85e5C0;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        DIAPushOracleMinimal oracle = new DIAPushOracleMinimal(SOMNIA_DIA_PUSH_ORACLE);
        
        console.log("Minimal Oracle deployed at:", address(oracle));
        
        vm.stopBroadcast();
    }
}