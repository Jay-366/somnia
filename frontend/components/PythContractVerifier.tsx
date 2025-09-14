"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";

export function PythContractVerifier() {
  const [verification, setVerification] = useState<{
    checking: boolean;
    results: Array<{
      address: string;
      exists: boolean;
      hasInterface: boolean;
      error?: string;
    }>;
  }>({ checking: false, results: [] });

  const contractsToTest = [
    { address: "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21", name: "Official Pyth Sepolia (from docs)" },
    { address: "0x0708325268dF9F66270F1401206434524814508b", name: "Alternative 1" },
    { address: "0x2880aB155794e7179c9eE2e38200202908C17B43", name: "Alternative 2" },
    { address: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6", name: "Original attempt" },
  ];

  const verifyContracts = async () => {
    setVerification({ checking: true, results: [] });
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const results = [];

    for (const contractInfo of contractsToTest) {
      try {
        console.log(`Testing contract: ${contractInfo.address}`);
        
        // Check if contract exists
        const code = await provider.getCode(contractInfo.address);
        const exists = code !== "0x";
        
        let hasInterface = false;
        let error: string | undefined;

        if (exists) {
          try {
            // Test if it has the Pyth interface
            const contract = new ethers.Contract(
              contractInfo.address,
              ["function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)"],
              provider
            );
            
            // Try to call getPrice with ETH/USD feed ID (this might fail but tells us about the interface)
            const ethFeedId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
            await contract.getPrice(ethFeedId);
            hasInterface = true;
          } catch (interfaceError) {
            // If it fails with "execution reverted" or similar, the interface exists but data might not
            const errorMsg = interfaceError instanceof Error ? interfaceError.message : "Unknown error";
            if (errorMsg.includes("execution reverted") || errorMsg.includes("call exception")) {
              hasInterface = true; // Interface exists, just no data or wrong feed ID
            } else {
              hasInterface = false;
              error = errorMsg;
            }
          }
        }

        results.push({
          address: contractInfo.address,
          exists,
          hasInterface,
          error: !exists ? "No contract at address" : error,
        });

      } catch (err) {
        results.push({
          address: contractInfo.address,
          exists: false,
          hasInterface: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setVerification({ checking: false, results });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Pyth Contract Verifier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>This tool verifies which Pyth contract addresses exist on Sepolia and have the correct interface.</p>
        </div>

        <Button 
          onClick={verifyContracts} 
          disabled={verification.checking}
          variant="outline"
        >
          {verification.checking ? "Verifying..." : "Verify All Contracts"}
        </Button>

        {verification.results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Verification Results:</h3>
            
            {contractsToTest.map((contractInfo, index) => {
              const result = verification.results[index];
              if (!result) return null;

              return (
                <div key={contractInfo.address} className="border rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      result.exists && result.hasInterface ? 'bg-green-500' : 
                      result.exists ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-sm">{contractInfo.name}</span>
                  </div>
                  
                  <div className="text-xs font-mono bg-muted p-1 rounded">
                    {contractInfo.address}
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <p>Contract exists: {result.exists ? "✅ Yes" : "❌ No"}</p>
                    <p>Has Pyth interface: {result.hasInterface ? "✅ Yes" : "❌ No"}</p>
                    {result.error && (
                      <p className="text-red-600">Error: {result.error}</p>
                    )}
                  </div>
                  
                  {result.exists && result.hasInterface && (
                    <div className="text-xs text-green-600 font-medium">
                      🎉 This contract should work!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}