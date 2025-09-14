import { NextRequest, NextResponse } from "next/server";
import { PythClient, PRICE_FEEDS } from "@/lib/pyth";

export async function GET() {
  try {
    const pythClient = new PythClient();
    
    // Get multiple price feeds
    const feedIds = Object.values(PRICE_FEEDS);
    const prices = await pythClient.getMultiplePrices(feedIds, 60);
    
    // Format the response
    const formattedPrices = prices.map((price) => ({
      feedId: price.feedId,
      symbol: Object.keys(PRICE_FEEDS).find(
        key => PRICE_FEEDS[key as keyof typeof PRICE_FEEDS] === price.feedId
      ),
      price: price.price,
      confidence: price.confidence,
      expo: price.expo,
      publishTime: price.publishTime,
      lastUpdated: Date.now() / 1000,
    }));

    return NextResponse.json({
      success: true,
      data: formattedPrices,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching Pyth feeds:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch price feeds",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// Optional: Add POST method for specific feed requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedIds, maxAge = 60 } = body;
    
    if (!feedIds || !Array.isArray(feedIds)) {
      return NextResponse.json(
        { success: false, error: "feedIds array is required" },
        { status: 400 }
      );
    }
    
    const pythClient = new PythClient();
    const prices = await pythClient.getMultiplePrices(feedIds, maxAge);
    
    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching specific Pyth feeds:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch price feeds",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}