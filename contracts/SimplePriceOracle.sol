// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract SimplePriceOracle {
    
    // DIA Push Oracle address on Somnia
    address public immutable diaOracle;
    
    constructor(address _diaOracle) {
        diaOracle = _diaOracle;
    }
    
    // Simple interface to call DIA oracle directly
    function getPrice(string memory key) public view returns (uint128 timestamp, uint128 price) {
        (bool success, bytes memory data) = diaOracle.staticcall(
            abi.encodeWithSignature("updates(string)", key)
        );
        
        if (success && data.length >= 64) {
            (timestamp, price) = abi.decode(data, (uint128, uint128));
        }
    }
    
    function getETHUSDPrice() external view returns (uint128 timestamp, uint128 price) {
        return getPrice("ETH/USD");
    }
    
    function getBTCUSDPrice() external view returns (uint128 timestamp, uint128 price) {
        return getPrice("BTC/USD");
    }
    
    function getARBUSDPrice() external view returns (uint128 timestamp, uint128 price) {
        return getPrice("ARB/USD");
    }
    
    function getSOLUSDPrice() external view returns (uint128 timestamp, uint128 price) {
        return getPrice("SOL/USD");
    }
    
    function getLINKUSDPrice() external view returns (uint128 timestamp, uint128 price) {
        return getPrice("LINK/USD");
    }
    
    function getSOMIUSDPrice() external view returns (uint128 timestamp, uint128 price) {
        return getPrice("SOMI/USD");
    }
    
    // Get all prices at once
    function getAllPrices() external view returns (
        uint128[6] memory timestamps,
        uint128[6] memory prices,
        string[6] memory keys
    ) {
        keys[0] = "ETH/USD";
        keys[1] = "BTC/USD";
        keys[2] = "ARB/USD";
        keys[3] = "SOL/USD";
        keys[4] = "LINK/USD";
        keys[5] = "SOMI/USD";
        
        for (uint i = 0; i < 6; i++) {
            (timestamps[i], prices[i]) = getPrice(keys[i]);
        }
    }
}