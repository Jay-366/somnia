// Fallback price service using CoinGecko API as backup
export class FallbackPriceService {
  private static readonly COINGECKO_API = "https://api.coingecko.com/api/v3";

  static async getEthPrice(): Promise<number> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.ethereum?.usd || 0;
    } catch (error) {
      console.error("Failed to fetch ETH price from CoinGecko:", error);
      throw error;
    }
  }

  static async getBtcPrice(): Promise<number> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.bitcoin?.usd || 0;
    } catch (error) {
      console.error("Failed to fetch BTC price from CoinGecko:", error);
      throw error;
    }
  }

  static async getMultiplePrices(): Promise<{
    ethereum: number;
    bitcoin: number;
  }> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=ethereum,bitcoin&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ethereum: data.ethereum?.usd || 0,
        bitcoin: data.bitcoin?.usd || 0,
      };
    } catch (error) {
      console.error("Failed to fetch prices from CoinGecko:", error);
      throw error;
    }
  }
}