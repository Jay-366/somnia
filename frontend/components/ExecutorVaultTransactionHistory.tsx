'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'swap';
  token: string;
  amount: string;
  hash: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export function ExecutorVaultTransactionHistory() {
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      token: 'WETH',
      amount: '1.5',
      hash: '0x1234...abcd',
      timestamp: new Date(Date.now() - 3600000),
      status: 'confirmed'
    },
    {
      id: '2',
      type: 'swap',
      token: 'AOT → WETH',
      amount: '100.0',
      hash: '0x5678...efgh',
      timestamp: new Date(Date.now() - 1800000),
      status: 'confirmed'
    },
    {
      id: '3',
      type: 'withdraw',
      token: 'WETH',
      amount: '0.5',
      hash: '0x9012...ijkl',
      timestamp: new Date(Date.now() - 300000),
      status: 'pending'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdraw': return '💸';
      case 'swap': return '🔄';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          📋 Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions yet. Start by depositing tokens!
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTypeIcon(tx.type)}</span>
                  <div>
                    <div className="text-white font-medium capitalize">
                      {tx.type} {tx.token}
                    </div>
                    <div className="text-sm text-gray-400">
                      {tx.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-medium">{tx.amount}</div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-white ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </Badge>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}