// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Interface for DIA Push Oracle Receiver
interface IPushOracleReceiver {
    function updates(string memory key) external view returns (uint128 timestamp, uint128 value);
}

contract DIAOracleSample {

    IPushOracleReceiver public diaOracle;
    string public key = "ETH/USD";

    constructor(address _oracle) {
        diaOracle = IPushOracleReceiver(_oracle);
    }

    function getPrice() 
    external 
    view
    returns (
        uint128 timestampOflatestPrice, 
        uint128 latestPrice
    ) {
        (timestampOflatestPrice, latestPrice) =   
                 diaOracle.updates(key); 
    }
    
    function getBTCPrice() 
    external 
    view
    returns (
        uint128 timestampOflatestPrice, 
        uint128 latestPrice
    ) {
        (timestampOflatestPrice, latestPrice) =   
                 diaOracle.updates("BTC/USD"); 
    }
    
    function getARBPrice() 
    external 
    view
    returns (
        uint128 timestampOflatestPrice, 
        uint128 latestPrice
    ) {
        (timestampOflatestPrice, latestPrice) =   
                 diaOracle.updates("ARB/USD"); 
    }
    
    function getSOLPrice() 
    external 
    view
    returns (
        uint128 timestampOflatestPrice, 
        uint128 latestPrice
    ) {
        (timestampOflatestPrice, latestPrice) =   
                 diaOracle.updates("SOL/USD"); 
    }
    
    function getLINKPrice() 
    external 
    view
    returns (
        uint128 timestampOflatestPrice, 
        uint128 latestPrice
    ) {
        (timestampOflatestPrice, latestPrice) =   
                 diaOracle.updates("LINK/USD"); 
    }
    
    function getSOMIPrice() 
    external 
    view
    returns (
        uint128 timestampOflatestPrice, 
        uint128 latestPrice
    ) {
        (timestampOflatestPrice, latestPrice) =   
                 diaOracle.updates("SOMI/USD"); 
    }
}