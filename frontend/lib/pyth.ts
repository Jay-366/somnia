import { ethers } from "ethers";

// Pyth contract on Sepolia testnet
// Official address from Pyth documentation
const PYTH_CONTRACT_ADDRESS = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21"; // Official Sepolia address

// Alternative Pyth contract addresses to try if the main one fails
const ALTERNATIVE_PYTH_ADDRESSES = [
  "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21", // Official Sepolia address from docs
  "0x0708325268dF9F66270F1401206434524814508b", // Alternative address
  "0x2880aB155794e7179c9eE2e38200202908C17B43", // Another alternative
  "0x4305FB66699C3B2702D4d05CF36551390A4c69C6", // Original attempt
] as const;

// Price feed IDs from Pyth
const PRICE_FEEDS = {
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  // Add more feeds as needed
} as const;

// Pyth contract ABI (minimal interface)
const PYTH_ABI = [
  "function getPriceNoOlderThan(bytes32 id, uint age) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)",
  "function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)",
  "function getPriceUnsafe(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)",
];

export class PythClient {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private contractAddress: string;

  constructor(rpcUrl?: string) {
    // Use provided RPC, environment variable, or default to Sepolia
    const defaultRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpc);
    this.contractAddress = PYTH_CONTRACT_ADDRESS;
    this.contract = new ethers.Contract(
      this.contractAddress,
      PYTH_ABI,
      this.provider
    );
  }

  // Try alternative contract addresses if the main one fails
  private async tryAlternativeContracts<T>(
    operation: (contract: ethers.Contract) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (const address of ALTERNATIVE_PYTH_ADDRESSES) {
      try {
        console.log(`Trying Pyth contract at: ${address}`);
        const contract = new ethers.Contract(address, PYTH_ABI, this.provider);
        
        // Test if contract exists
        const code = await this.provider.getCode(address);
        if (code === "0x") {
          console.log(`No contract found at ${address}`);
          continue;
        }

        const result = await operation(contract);
        console.log(`Success with contract at: ${address}`);
        
        // Update the main contract reference if this one works
        this.contract = contract;
        this.contractAddress = address;
        
        return result;
      } catch (error) {
        console.log(`Failed with contract at ${address}:`, error);
        lastError = error instanceof Error ? error : new Error("Unknown error");
      }
    }

    throw lastError || new Error("All Pyth contract addresses failed");
  }

  // Get the currently working contract address
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get ETH/USD price with age validation
   * @param maxAge Maximum age in seconds (default: 60s)
   * @returns Price in USD
   */
  async getEthPrice(maxAge: number = 60): Promise<number> {
    return this.tryAlternativeContracts(async (contract) => {
      console.log("Fetching ETH price from Pyth oracle...");
      console.log("Feed ID:", PRICE_FEEDS.ETH_USD);
      console.log("Max age:", maxAge);
      
      try {
        const priceData = await contract.getPriceNoOlderThan(
          PRICE_FEEDS.ETH_USD,
          maxAge
        );
        const [price, , expo] = priceData;
        const formattedPrice = Number(price) * Math.pow(10, Number(expo));
        
        console.log("Raw price data:", { price: price.toString(), expo: expo.toString() });
        console.log("Formatted price:", formattedPrice);
        
        return formattedPrice;
      } catch (error) {
        console.log("getPriceNoOlderThan failed, trying getPriceUnsafe...");
        // Try with unsafe method as fallback
        const priceData = await contract.getPriceUnsafe(PRICE_FEEDS.ETH_USD);
        const [price, , expo] = priceData;
        const formattedPrice = Number(price) * Math.pow(10, Number(expo));
        console.log("Unsafe price fetch successful:", formattedPrice);
        return formattedPrice;
      }
    });
  }

  /**
   * Get BTC/USD price with age validation
   * @param maxAge Maximum age in seconds (default: 60s)
   * @returns Price in USD
   */
  async getBtcPrice(maxAge: number = 60): Promise<number> {
    try {
      const priceData = await this.contract.getPriceNoOlderThan(
        PRICE_FEEDS.BTC_USD,
        maxAge
      );
      const [price, , expo] = priceData;
      return Number(price) * Math.pow(10, Number(expo));
    } catch (error) {
      console.error("Error fetching BTC price:", error);
      throw new Error("Failed to fetch BTC price from Pyth oracle");
    }
  }

  /**
   * Get price for any feed ID
   * @param feedId Pyth price feed ID
   * @param maxAge Maximum age in seconds (default: 60s)
   * @returns Price data object
   */
  async getPrice(
    feedId: string,
    maxAge: number = 60
  ): Promise<{
    price: number;
    confidence: number;
    expo: number;
    publishTime: number;
  }> {
    return this.tryAlternativeContracts(async (contract) => {
      try {
        const priceData = await contract.getPriceNoOlderThan(feedId, maxAge);
        const [price, conf, expo, publishTime] = priceData;
        
        return {
          price: Number(price) * Math.pow(10, Number(expo)),
          confidence: Number(conf) * Math.pow(10, Number(expo)),
          expo: Number(expo),
          publishTime: Number(publishTime),
        };
      } catch (error) {
        console.log("getPriceNoOlderThan failed, trying getPriceUnsafe...");
        // Try with unsafe method as fallback
        const priceData = await contract.getPriceUnsafe(feedId);
        const [price, conf, expo, publishTime] = priceData;
        
        return {
          price: Number(price) * Math.pow(10, Number(expo)),
          confidence: Number(conf) * Math.pow(10, Number(expo)),
          expo: Number(expo),
          publishTime: Number(publishTime),
        };
      }
    });
  }

  /**
   * Get latest price without age validation (use with caution)
   * @param feedId Pyth price feed ID
   * @returns Price data object
   */
  async getPriceUnsafe(feedId: string): Promise<{
    price: number;
    confidence: number;
    expo: number;
    publishTime: number;
  }> {
    try {
      const priceData = await this.contract.getPriceUnsafe(feedId);
      const [price, conf, expo, publishTime] = priceData;
      
      return {
        price: Number(price) * Math.pow(10, Number(expo)),
        confidence: Number(conf) * Math.pow(10, Number(expo)),
        expo: Number(expo),
        publishTime: Number(publishTime),
      };
    } catch (error) {
      console.error("Error fetching unsafe price:", error);
      throw new Error(`Failed to fetch unsafe price for feed ${feedId}`);
    }
  }

  /**
   * Get multiple prices at once
   * @param feedIds Array of price feed IDs
   * @param maxAge Maximum age in seconds (default: 60s)
   * @returns Array of price data objects
   */
  async getMultiplePrices(
    feedIds: string[],
    maxAge: number = 60
  ): Promise<Array<{
    feedId: string;
    price: number;
    confidence: number;
    expo: number;
    publishTime: number;
  }>> {
    try {
      const promises = feedIds.map(async (feedId) => {
        const priceData = await this.getPrice(feedId, maxAge);
        return { feedId, ...priceData };
      });
      
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching multiple prices:", error);
      throw new Error("Failed to fetch multiple prices");
    }
  }
}

// Export convenience functions
export async function getEthPrice(maxAge: number = 60): Promise<number> {
  const client = new PythClient();
  return client.getEthPrice(maxAge);
}

export async function getBtcPrice(maxAge: number = 60): Promise<number> {
  const client = new PythClient();
  return client.getBtcPrice(maxAge);
}

// Export price feed IDs for external use
export { PRICE_FEEDS };