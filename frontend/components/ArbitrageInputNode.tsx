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
  const wethPrice = 1847.23; // $1847.23 per WETH
  const aotOraclePrice = 1852.50; // $1852.50 per AOT (oracle price)
  const aotPoolPrice = 1847.23; // $1847.23 per AOT (pool price, same as WETH)
  const profitPerAot = aotOraclePrice - aotPoolPrice; // $5.27 profit per AOT
  const gasCost = 2; // $2 estimated gas cost

  useEffect(() => {
    const wethAmount = parseFloat(amount);
    if (!isNaN(wethAmount) && wethAmount > 0) {
      // Calculate how many AOT tokens we can get with WETH amount
      const aotAmount = wethAmount * (wethPrice / aotPoolPrice);
      // Calculate gross profit from selling AOT at oracle price
      const grossProfit = aotAmount * profitPerAot;
      // Calculate net profit after gas
      const netProfit = Math.max(0, grossProfit - gasCost);
      
      setEstimatedProfit(netProfit);
      setIsValidAmount(wethAmount >= 0.01); // Minimum 0.01 WETH
      
      // Notify parent component with WETH amount and profit
      if (data.onAmountChange) {
        data.onAmountChange(wethAmount, netProfit);
      }
    } else {
      setEstimatedProfit(0);
      setIsValidAmount(false);
      if (data.onAmountChange) {
        data.onAmountChange(0, 0);
      }
    }
  }, [amount, data.onAmountChange, wethPrice, aotPoolPrice, aotOraclePrice, profitPerAot, gasCost]);

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
      
      <Card className={`min-w-[320px] border-2 transition-all ${
        selected 
          ? 'border-[rgb(30,255,195)] bg-[rgb(30,255,195)]/10 shadow-lg shadow-[rgb(30,255,195)]/25' 
          : 'border-slate-600 bg-slate-800/95 hover:border-[rgb(178,255,238)]'
      }`}>
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="text-3xl mb-2">{data.emoji}</div>
            <div className="text-lg font-semibold text-white">{data.label}</div>
            <div className="text-sm text-gray-400">{data.subtitle}</div>
          </div>

          {/* Arbitrage Opportunity Info */}
          <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
            <div className="text-xs text-[rgb(30,255,195)] font-semibold">WETH/AOT ARBITRAGE</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-400">AOT Oracle Price</div>
                <div className="text-white font-medium">${aotOraclePrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">AOT Pool Price</div>
                <div className="text-white font-medium">${aotPoolPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-center pt-1">
              <div className="text-green-400 font-bold">+${profitPerAot.toFixed(2)} per AOT</div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 font-medium">
              WETH Swap Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter WETH amount (min. 0.01)"
                className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[rgb(30,255,195)] focus:outline-none focus:ring-1 focus:ring-[rgb(30,255,195)]/50"
                min="0.01"
                step="0.01"
              />
              <div className="absolute right-3 top-2 text-gray-400 text-sm">WETH</div>
            </div>
            {amount && !isValidAmount && (
              <div className="text-red-400 text-xs">Minimum amount is 0.01 WETH</div>
            )}
          </div>

          {/* Profit Calculation */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
              <div className="text-xs text-[rgb(30,255,195)] font-semibold">ARBITRAGE CALCULATION</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">WETH Amount:</span>
                  <span className="text-white">{parseFloat(amount).toFixed(4)} WETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AOT Received:</span>
                  <span className="text-white">
                    {(parseFloat(amount) * (wethPrice / aotPoolPrice)).toFixed(4)} AOT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gross Profit:</span>
                  <span className="text-white">
                    ${(parseFloat(amount) * (wethPrice / aotPoolPrice) * profitPerAot).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Est. Gas Cost:</span>
                  <span className="text-red-300">-${gasCost.toFixed(2)}</span>
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
              {estimatedProfit <= 0 && (
                <div className="text-amber-400 text-xs mt-2">
                  ⚠️ Low profit potential - consider higher amount
                </div>
              )}
            </div>
          )}

          {/* Proceed Button */}
          <Button
            onClick={handleProceedToEscrow}
            disabled={!isValidAmount || estimatedProfit <= 0}
            className={`w-full transition-all font-semibold ${
              isValidAmount && estimatedProfit > 0
                ? 'bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {!isValidAmount ? 'Enter Valid Amount' : 
             estimatedProfit <= 0 ? 'Insufficient Profit' : 
             'Proceed to Escrow'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};