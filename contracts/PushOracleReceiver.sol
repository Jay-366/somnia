// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title PushOracleReceiver
 * @dev Interface for DIA Push Oracle Receiver based on official documentation
 */
contract PushOracleReceiver {
    
    struct Data {
        string key;
        uint128 timestamp;
        uint128 value;
    }
    
    mapping(string => Data) public updates;
    
    // This would be populated by DIA's oracle system
    // For our implementation, we're creating the interface structure
    
    function getLatestPrice(string memory key) external view returns (uint128 timestamp, uint128 value) {
        Data memory data = updates[key];
        return (data.timestamp, data.value);
    }
}