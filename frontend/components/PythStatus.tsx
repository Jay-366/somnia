"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PythClient } from "@/lib/pyth";

export function PythStatus() {
  const [status, setStatus] = useState<{
    working: boolean;
    contractAddress?: string;
    error?: string;
    testPrice?: number;
  }>({ working: false });
  const [testing, setTesting] = useState(false);

  const testPythConnection = async () => {
    setTesting(true);
    try {
      const pythClient = new PythClient();
      
      // Try to get a simple price to test connectivity
      const ethPrice = await pythClient.getEthPrice(300); // Allow 5 minutes old
      const workingAddress = pythClient.getContractAddress();
      
      setStatus({
        working: true,
        contractAddress: workingAddress,
        testPrice: ethPrice,
      });
    } catch (error) {
      setStatus({
        working: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    testPythConnection();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔮 Pyth Oracle Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status.working ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm">
            {status.working ? 'Oracle Connected' : 'Oracle Disconnected'}
          </span>
        </div>
        
        {status.contractAddress && (
          <div className="text-xs text-muted-foreground">
            <p><strong>Working Contract:</strong></p>
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              {status.contractAddress}
            </code>
          </div>
        )}
        
        {status.testPrice && (
          <div className="text-xs text-muted-foreground">
            <p><strong>Test ETH Price:</strong> ${status.testPrice.toFixed(2)}</p>
          </div>
        )}
        
        {status.error && (
          <div className="text-xs text-red-600">
            <p><strong>Error:</strong> {status.error}</p>
          </div>
        )}
        
        <Button 
          onClick={testPythConnection} 
          disabled={testing}
          variant="outline" 
          size="sm"
        >
          {testing ? "Testing..." : "Test Connection"}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p>This component tests Pyth oracle connectivity and shows which contract address is working.</p>
        </div>
      </CardContent>
    </Card>
  );
}