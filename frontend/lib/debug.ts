import { ethers } from "ethers";

// Debug utility to test Pyth contract connectivity
export async function debugPythContract() {
  const PYTH_CONTRACT_ADDRESS = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21"; // Official Sepolia address
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";
  
  console.log("=== Pyth Contract Debug ===");
  console.log("RPC URL:", rpcUrl);
  console.log("Contract Address:", PYTH_CONTRACT_ADDRESS);
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test basic connectivity
    const network = await provider.getNetwork();
    console.log("Network:", network);
    
    const blockNumber = await provider.getBlockNumber();
    console.log("Latest block:", blockNumber);
    
    // Test contract code exists
    const code = await provider.getCode(PYTH_CONTRACT_ADDRESS);
    console.log("Contract code length:", code.length);
    console.log("Contract exists:", code !== "0x");
    
    // Test simple contract call
    const contract = new ethers.Contract(
      PYTH_CONTRACT_ADDRESS,
      ["function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)"],
      provider
    );
    
    const ETH_USD_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
    
    console.log("Attempting to call getPrice...");
    const priceData = await contract.getPrice(ETH_USD_FEED_ID);
    console.log("Price data:", priceData);
    
    return {
      success: true,
      network,
      blockNumber,
      contractExists: code !== "0x",
      priceData
    };
    
  } catch (error) {
    console.error("Debug failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Test token contract connectivity
export async function debugTokenContract(tokenAddress: string, userAddress: string) {
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";
  
  console.log("=== Token Contract Debug ===");
  console.log("RPC URL:", rpcUrl);
  console.log("Token Address:", tokenAddress);
  console.log("User Address:", userAddress);
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test contract code exists
    const code = await provider.getCode(tokenAddress);
    console.log("Token contract exists:", code !== "0x");
    
    if (code === "0x") {
      throw new Error("Token contract not found at address");
    }
    
    // Test ERC20 calls
    const contract = new ethers.Contract(
      tokenAddress,
      [
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)",
        "function balanceOf(address owner) external view returns (uint256)"
      ],
      provider
    );
    
    const [name, symbol, decimals, balance] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.balanceOf(userAddress)
    ]);
    
    console.log("Token info:", { name, symbol, decimals });
    console.log("Balance:", ethers.formatUnits(balance, decimals));
    
    return {
      success: true,
      tokenInfo: { name, symbol, decimals },
      balance: ethers.formatUnits(balance, decimals)
    };
    
  } catch (error) {
    console.error("Token debug failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}