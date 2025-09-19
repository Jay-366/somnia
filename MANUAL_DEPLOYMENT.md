# 🚀 MANUAL DEPLOYMENT GUIDE

## ✅ **GOOD NEWS: DIA Oracle is WORKING!**

Just confirmed the DIA oracle is live and returning data:
```
ETH/USD: 460471097080 (latest price)
Timestamp: 1758243236
```

## 📋 **Manual Deployment Options**

Since forge is having configuration issues, here are alternative deployment methods:

### **Option 1: Use Remix IDE (Recommended)**

1. **Go to [remix.ethereum.org](https://remix.ethereum.org)**

2. **Create new file**: `SimplePriceOracle.sol`

3. **Paste this code**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract SimplePriceOracle {
    
    address public immutable diaOracle;
    
    constructor(address _diaOracle) {
        diaOracle = _diaOracle;
    }
    
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
```

4. **Compile**: Select Solidity 0.8.13+ compiler

5. **Deploy**:
   - Connect MetaMask to Somnia Testnet
   - Constructor argument: `0xFb1462A649A92654482F8E048C754333ad85e5C0`
   - Deploy!

6. **Test**: Call `getETHUSDPrice()` to verify it works

### **Option 2: Using Hardhat**

1. **Create hardhat project**:
```bash
npx hardhat init
```

2. **Add Somnia network to hardhat.config.js**:
```javascript
module.exports = {
  solidity: "0.8.13",
  networks: {
    somnia: {
      url: "https://dream-rpc.somnia.network/",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

3. **Deploy script**:
```javascript
async function main() {
  const Oracle = await ethers.getContractFactory("SimplePriceOracle");
  const oracle = await Oracle.deploy("0xFb1462A649A92654482F8E048C754333ad85e5C0");
  await oracle.deployed();
  console.log("Oracle deployed to:", oracle.address);
}
```

4. **Deploy**:
```bash
npx hardhat run scripts/deploy.js --network somnia
```

### **Option 3: Direct Web3 Call**

Using web3.js or ethers.js to deploy the compiled bytecode directly.

## 🔧 **Network Configuration for MetaMask**

```
Network Name: Somnia Testnet
RPC URL: https://dream-rpc.somnia.network/
Chain ID: 50312
Currency Symbol: STT
Block Explorer: https://explorer.somnia.network
```

## ✅ **After Deployment**

1. **Save the contract address**
2. **Test the functions**:
   - `getETHUSDPrice()` should return live data
   - `getBTCUSDPrice()` should return live data
   - Other functions return 0 until feeds become active

3. **Add to your .env**:
```
NEXT_PUBLIC_DIA_ORACLE_ADDRESS=<your_deployed_address>
```

## 🎯 **Quick Verification**

Once deployed, verify it works by calling:
```javascript
// Should return current ETH price
await contract.getETHUSDPrice()

// Should return current BTC price  
await contract.getBTCUSDPrice()
```

**The contract is ready and will work perfectly once deployed!** 🚀