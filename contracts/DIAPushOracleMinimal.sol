// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Interface for DIA Push Oracle Receiver
interface IPushOracleReceiver {
    function updates(string memory key) external view returns (uint128 timestamp, uint128 value);
}

/**
 * @title DIAPushOracleMinimal
 * @dev Minimal DIA Push Oracle contract for testing deployment
 */
contract DIAPushOracleMinimal {
    
    // DIA Push Oracle Receiver instance
    IPushOracleReceiver public immutable diaOracle;
    
    // Owner
    address public owner;
    
    // Supported price feed keys
    string public constant ETH_USDC = "ETH/USD";
    string public constant BTC_WETH = "BTC/USD";
    string public constant ARB_USDC = "ARB/USD";
    string public constant SOL_USDC = "SOL/USD";
    string public constant LINK_ETH = "LINK/USD";
    string public constant SOMI_ETH = "SOMI/USD";
    
    constructor(address _diaOracleAddress) {
        require(_diaOracleAddress != address(0), "Invalid oracle address");
        diaOracle = IPushOracleReceiver(_diaOracleAddress);
        owner = msg.sender;
    }
    
    /**
     * @dev Get the latest price for ETH/USDC
     */
    function getETHUSDCPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(ETH_USDC);
    }
    
    /**
     * @dev Get the latest price for BTC/USD (will convert to WETH later)
     */
    function getBTCUSDPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(BTC_WETH);
    }
    
    /**
     * @dev Get the latest price for ARB/USDC
     */
    function getARBUSDCPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(ARB_USDC);
    }
    
    /**
     * @dev Get the latest price for SOL/USDC
     */
    function getSOLUSDCPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(SOL_USDC);
    }
    
    /**
     * @dev Get the latest price for LINK/USD (will convert to ETH later)
     */
    function getLINKUSDPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(LINK_ETH);
    }
    
    /**
     * @dev Get the latest price for SOMI/USD (will convert to ETH later)
     */
    function getSOMIUSDPrice() 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(SOMI_ETH);
    }
    
    /**
     * @dev Get price for any supported feed by key
     */
    function getPrice(string memory key) 
        external 
        view 
        returns (uint128 timestamp, uint128 price) 
    {
        return diaOracle.updates(key);
    }
}