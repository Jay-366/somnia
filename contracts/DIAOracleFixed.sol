// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { PushOracleReceiver } from "@dia-data/contracts-spectra/PushOracleReceiver.sol";

contract DIAOracleFixed {

    PushOracleReceiver public diaOracle;
    
    constructor(address _oracle) {
        diaOracle = PushOracleReceiver(payable(_oracle));
    }

    function getETHUSDPrice() 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates("ETH/USD");
    }
    
    function getBTCUSDPrice() 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates("BTC/USD");
    }
    
    function getARBUSDPrice() 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates("ARB/USD");
    }
    
    function getSOLUSDPrice() 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates("SOL/USD");
    }
    
    function getLINKUSDPrice() 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates("LINK/USD");
    }
    
    function getSOMIUSDPrice() 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates("SOMI/USD");
    }
    
    // Helper function to get any price by key
    function getPrice(string memory key) 
    external 
    view
    returns (
        uint128 timestamp, 
        uint128 price
    ) {
        (timestamp, price) = diaOracle.updates(key);
    }
    
    // Get all main prices at once for efficiency
    function getAllPrices() 
    external 
    view
    returns (
        uint128[6] memory timestamps,
        uint128[6] memory prices
    ) {
        (timestamps[0], prices[0]) = diaOracle.updates("ETH/USD");
        (timestamps[1], prices[1]) = diaOracle.updates("BTC/USD");
        (timestamps[2], prices[2]) = diaOracle.updates("ARB/USD");
        (timestamps[3], prices[3]) = diaOracle.updates("SOL/USD");
        (timestamps[4], prices[4]) = diaOracle.updates("LINK/USD");
        (timestamps[5], prices[5]) = diaOracle.updates("SOMI/USD");
    }
}