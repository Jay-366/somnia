"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatTimeAgo, calculatePriceChange } from "@/lib/utils";
import { PythClient } from "@/lib/pyth";
import { FallbackPriceService } from "@/lib/fallback-prices";

interface PriceData {
  price: number;
  confidence: number;
  publishTime: number;
  lastUpdated: number;
}

interface PriceCardProps {
  title: string;
  symbol: string;
  feedId: string;
  previousPrice?: number;
}

export function PriceCard({ title, symbol, feedId, previousPrice }: PriceCardProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try Pyth oracle first
      const pythClient = new PythClient();
      const data = await pythClient.getPrice(feedId, 60);
      
      setPriceData({
        price: data.price,
        confidence: data.confidence,
        publishTime: data.publishTime,
        lastUpdated: Date.now() / 1000,
      });
    } catch (pythError) {
      console.warn("Pyth oracle failed, trying fallback:", pythError);
      
      // Try fallback price service
      try {
        let fallbackPrice: number;
        
        if (symbol.includes("ETH")) {
          fallbackPrice = await FallbackPriceService.getEthPrice();
        } else if (symbol.includes("BTC")) {
          fallbackPrice = await FallbackPriceService.getBtcPrice();
        } else {
          throw new Error("No fallback available for this symbol");
        }
        
        setPriceData({
          price: fallbackPrice,
          confidence: 0, // No confidence data from fallback
          publishTime: Date.now() / 1000,
          lastUpdated: Date.now() / 1000,
        });
        
        setError("Using fallback price service (CoinGecko)");
      } catch (fallbackError) {
        setError(
          `Both Pyth oracle and fallback failed. Pyth: ${pythError instanceof Error ? pythError.message : 'Unknown error'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [feedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const priceChange = previousPrice && priceData 
    ? calculatePriceChange(priceData.price, previousPrice)
    : null;

  const isPositive = priceChange !== null && priceChange > 0;
  const isNegative = priceChange !== null && priceChange < 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">{symbol}</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading && (
            <div className="text-2xl font-bold text-muted-foreground">
              Loading...
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          
          {priceData && !loading && (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(priceData.price)}
              </div>
              
              {priceChange !== null && (
                <div className={`text-xs ${
                  isPositive ? "text-green-600" : 
                  isNegative ? "text-red-600" : 
                  "text-muted-foreground"
                }`}>
                  {isPositive && "+"}{priceChange.toFixed(2)}%
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Confidence: ±{formatCurrency(priceData.confidence)}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Updated: {formatTimeAgo(priceData.publishTime)}
              </div>
              
              {priceData.confidence === 0 && (
                <div className="text-xs text-yellow-600">
                  ⚠️ Using fallback price source
                </div>
              )}
            </>
          )}
          
          <Button 
            onClick={fetchPrice} 
            disabled={loading}
            size="sm"
            variant="outline"
            className="w-full mt-2"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}