'use client';

import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ArbitrageInputNodeProps {
  data: {
    emoji: string;
    label: string;
    subtitle: string;
    onAmountChange?: (amount: number, profit: number) => void;
    onProceedToEscrow?: () => void;
    onNodeClick?: (nodeId: string) => void;
  };
  selected: boolean;
  id: string;
}

export const ArbitrageInputNode = ({ data, selected, id }: ArbitrageInputNodeProps) => {
  const [amount, setAmount] = useState<string>('');
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);
  const [isValidAmount, setIsValidAmount] = useState<boolean>(false);

  // Arbitrage parameters (these could be props or from context in real app)
  const aotPrice = 4512.60; // $4512.60 per AOT (pool price)
  const wethOraclePrice = 4519.15; // $4519.15 per WETH (oracle price)
  const wethPoolPrice = 4512.60; // $4512.60 per WETH (pool price, same as AOT)
  const profitPerWeth = wethOraclePrice - wethPoolPrice; // $6.55 profit per WETH

  useEffect(() => {
    const aotAmount = parseFloat(amount);
    if (!isNaN(aotAmount) && aotAmount > 0) {
      // Calculate how many WETH tokens we can get with AOT amount
      const wethAmount = aotAmount * (aotPrice / wethPoolPrice);
      // Calculate net profit directly (no gas cost deduction)
      const netProfit = wethAmount * profitPerWeth;
      
      setEstimatedProfit(netProfit);
      setIsValidAmount(aotAmount > 0); // Remove minimum limit - any amount > 0 is valid
      
      // Notify parent component with AOT amount and profit
      if (data.onAmountChange) {
        data.onAmountChange(aotAmount, netProfit);
      }
    } else {
      setEstimatedProfit(0);
      setIsValidAmount(false);
      if (data.onAmountChange) {
        data.onAmountChange(0, 0);
      }
    }
  }, [amount, data.onAmountChange, aotPrice, wethPoolPrice, wethOraclePrice, profitPerWeth]);

  const handleProceedToEscrow = () => {
    if (isValidAmount && data.onProceedToEscrow) {
      data.onProceedToEscrow();
    }
  };

  return (
    <div 
      className={`relative transition-all duration-300 cursor-pointer ${
        selected 
          ? 'scale-[1.02]' 
          : ''
      }`}
      onClick={(e) => {
        console.log(`🎯 ArbitrageInputNode direct click: ${data.label} (${id})`);
        if (data.onNodeClick) {
          data.onNodeClick(id);
        }
        e.stopPropagation();
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[rgb(30,255,195)] !border-2 !border-slate-800"
      />
      
      <Card className={`min-w-[320px] min-h-[400px] border-2 transition-all ${
        selected 
          ? 'border-[rgb(30,255,195)] bg-[rgb(30,255,195)]/10 shadow-lg shadow-[rgb(30,255,195)]/25' 
          : 'border-slate-600 bg-slate-800/95 hover:border-[rgb(178,255,238)]'
      }`}>
        <CardContent className="p-4 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="text-center">
            <div className="text-3xl mb-2">{data.emoji}</div>
            <div className="text-lg font-semibold text-white">{data.label}</div>
            <div className="text-sm text-gray-400">{data.subtitle}</div>
          </div>

          {/* Arbitrage Opportunity Info */}
          <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
            <div className="text-xs text-[rgb(30,255,195)] font-semibold">AOT/WETH ARBITRAGE</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-400">WETH Oracle Price</div>
                <div className="text-white font-medium">${wethOraclePrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">WETH Pool Price</div>
                <div className="text-white font-medium">${wethPoolPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-center pt-1">
              <div className="text-green-400 font-bold">+${profitPerWeth.toFixed(2)} per WETH</div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 font-medium">
              AOT Swap Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter AOT amount (any amount)"
                className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[rgb(30,255,195)] focus:outline-none focus:ring-1 focus:ring-[rgb(30,255,195)]/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="0"
                step="0.001"
              />
              <div className="absolute right-3 top-2 text-gray-400 text-sm">AOT</div>
            </div>
            {amount && !isValidAmount && (
              <div className="text-red-400 text-xs">Amount must be greater than 0</div>
            )}
          </div>

          {/* Profit Calculation - Fixed Height Container */}
          <div className="min-h-[120px]">
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                <div className="text-xs text-[rgb(30,255,195)] font-semibold">ARBITRAGE CALCULATION</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">AOT Amount:</span>
                    <span className="text-white">{parseFloat(amount).toFixed(4)} AOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WETH Received:</span>
                    <span className="text-white">
                      {(parseFloat(amount) * (aotPrice / wethPoolPrice)).toFixed(4)} WETH
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-300 font-medium">Net Profit:</span>
                      <span className={`font-bold ${estimatedProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${estimatedProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                {estimatedProfit > 0 && (
                  <div className="text-green-400 text-xs mt-2">
                    Profitable arbitrage opportunity detected!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spacer to push button to bottom */}
          <div className="flex-grow"></div>

          {/* Proceed Button */}
          <Button
            onClick={handleProceedToEscrow}
            disabled={!isValidAmount}
            className={`w-full transition-all font-semibold ${
              isValidAmount
                ? 'bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {!isValidAmount ? 'Enter Valid Amount' : 'Proceed to Escrow'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};