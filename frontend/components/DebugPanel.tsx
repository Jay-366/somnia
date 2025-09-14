"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { debugPythContract, debugTokenContract } from "@/lib/debug";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

interface DebugPanelProps {
  userAddress?: string;
}

export function DebugPanel({ userAddress }: DebugPanelProps) {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPythDebug = async () => {
    setLoading(true);
    try {
      const result = await debugPythContract();
      setDebugResults(prev => ({ ...prev, pyth: result }));
    } catch (error) {
      setDebugResults(prev => ({ 
        ...prev, 
        pyth: { success: false, error: error instanceof Error ? error.message : "Unknown error" }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runTokenDebug = async (tokenAddress: string, tokenName: string) => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const result = await debugTokenContract(tokenAddress, userAddress);
      setDebugResults(prev => ({ 
        ...prev, 
        [tokenName]: result 
      }));
    } catch (error) {
      setDebugResults(prev => ({ 
        ...prev, 
        [tokenName]: { success: false, error: error instanceof Error ? error.message : "Unknown error" }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllDebug = async () => {
    setLoading(true);
    setDebugResults({});
    
    // Test Pyth contract
    await runPythDebug();
    
    // Test token contracts if wallet connected
    if (userAddress) {
      await runTokenDebug(CONTRACT_ADDRESSES.WETH, "WETH");
      await runTokenDebug(CONTRACT_ADDRESSES.AOT_TOKEN, "AOT");
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runAllDebug} 
            disabled={loading}
            variant="outline"
          >
            {loading ? "Running..." : "Run All Tests"}
          </Button>
          
          <Button 
            onClick={runPythDebug} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Test Pyth Oracle
          </Button>
          
          {userAddress && (
            <>
              <Button 
                onClick={() => runTokenDebug(CONTRACT_ADDRESSES.WETH, "WETH")} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Test WETH
              </Button>
              
              <Button 
                onClick={() => runTokenDebug(CONTRACT_ADDRESSES.AOT_TOKEN, "AOT")} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Test AOT
              </Button>
            </>
          )}
        </div>

        {debugResults && (
          <div className="space-y-4">
            <h3 className="font-semibold">Debug Results:</h3>
            
            {Object.entries(debugResults).map(([key, result]: [string, any]) => (
              <div key={key} className="border rounded p-3">
                <h4 className="font-medium mb-2 capitalize">{key} Test</h4>
                
                {result.success ? (
                  <div className="text-green-600 text-sm">
                    ✅ Success
                    {result.network && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Network: {result.network.name} (Chain ID: {result.network.chainId.toString()})
                      </div>
                    )}
                    {result.blockNumber && (
                      <div className="text-xs text-muted-foreground">
                        Latest Block: {result.blockNumber}
                      </div>
                    )}
                    {result.contractExists !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Contract Exists: {result.contractExists ? "Yes" : "No"}
                      </div>
                    )}
                    {result.tokenInfo && (
                      <div className="text-xs text-muted-foreground">
                        Token: {result.tokenInfo.name} ({result.tokenInfo.symbol})
                      </div>
                    )}
                    {result.balance && (
                      <div className="text-xs text-muted-foreground">
                        Balance: {result.balance}
                      </div>
                    )}
                    {result.priceData && (
                      <div className="text-xs text-muted-foreground">
                        Price Data Available: Yes
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">
                    ❌ Failed: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>RPC Endpoint:</strong> {process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org"}</p>
          <p><strong>Pyth Contract:</strong> {CONTRACT_ADDRESSES.PYTH_ORACLE}</p>
          <p><strong>WETH Contract:</strong> {CONTRACT_ADDRESSES.WETH}</p>
          <p><strong>AOT Contract:</strong> {CONTRACT_ADDRESSES.AOT_TOKEN}</p>
        </div>
      </CardContent>
    </Card>
  );
}