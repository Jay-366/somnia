'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  OnConnect,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Custom Node Component
const CustomNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[120px] text-center transition-all relative ${
      selected 
        ? 'border-[rgb(30,255,195)] bg-[rgb(30,255,195)]/20 shadow-lg shadow-[rgb(30,255,195)]/25' 
        : 'border-slate-600 bg-slate-800/90 hover:border-[rgb(178,255,238)] hover:bg-slate-800'
    }`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[rgb(30,255,195)] !border-2 !border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[rgb(30,255,195)] !border-2 !border-slate-800"
      />
      
      <div className="text-2xl mb-1">{data.emoji}</div>
      <div className="text-sm font-semibold text-white">{data.label}</div>
      <div className="text-xs text-gray-400 mt-1">{data.subtitle}</div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function StrategyDetailPage() {
  const searchParams = useSearchParams();
  const strategyId = searchParams.get('id') || '1';
  
  const [selectedNode, setSelectedNode] = useState<string>('wallet');

  // Define the flow nodes
  const initialNodes: Node[] = [
    {
      id: 'wallet',
      type: 'custom',
      position: { x: 0, y: 100 },
      data: { 
        emoji: '💳', 
        label: 'User Wallet', 
        subtitle: 'MetaMask Connection' 
      },
    },
    {
      id: 'escrow',
      type: 'custom',
      position: { x: 200, y: 100 },
      data: { 
        emoji: '🔒', 
        label: 'Escrow Contract', 
        subtitle: 'Fund Locking' 
      },
    },
    {
      id: 'dex-pool',
      type: 'custom',
      position: { x: 400, y: 100 },
      data: { 
        emoji: '🏦', 
        label: 'DEX Pool', 
        subtitle: 'AOT/WETH' 
      },
    },
    {
      id: 'oracle',
      type: 'custom',
      position: { x: 600, y: 100 },
      data: { 
        emoji: '📊', 
        label: 'Pyth Oracle', 
        subtitle: 'Price Feed' 
      },
    },
    {
      id: 'detector',
      type: 'custom',
      position: { x: 800, y: 100 },
      data: { 
        emoji: '⚡', 
        label: 'Arbitrage Detector', 
        subtitle: 'Opportunity Scanner' 
      },
    },
    {
      id: 'swap',
      type: 'custom',
      position: { x: 1000, y: 100 },
      data: { 
        emoji: '🔄', 
        label: 'Swap Execution', 
        subtitle: 'Smart Contract' 
      },
    },
    {
      id: 'profit',
      type: 'custom',
      position: { x: 1200, y: 100 },
      data: { 
        emoji: '💰', 
        label: 'Profit Return', 
        subtitle: 'Withdraw Gains' 
      },
    },
  ];

  // Define the edges with better styling
  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'wallet',
      target: 'escrow',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
    {
      id: 'e2-3',
      source: 'escrow',
      target: 'dex-pool',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
    {
      id: 'e3-4',
      source: 'dex-pool',
      target: 'oracle',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
    {
      id: 'e4-5',
      source: 'oracle',
      target: 'detector',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
    {
      id: 'e5-6',
      source: 'detector',
      target: 'swap',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
    {
      id: 'e6-7',
      source: 'swap',
      target: 'profit',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  // Get details for selected node
  const getNodeDetails = (nodeId: string) => {
    const details: Record<string, any> = {
      wallet: {
        title: "User Wallet 💳",
        description: "Connect your MetaMask wallet to start arbitrage trading",
        status: "Connected",
        details: [
          { label: "Balance", value: "100 SST" },
          { label: "Address", value: "0x1234...abcd" },
          { label: "Network", value: "Ethereum Mainnet" },
        ],
        action: {
          label: "Deposit to Escrow",
          variant: "default"
        }
      },
      escrow: {
        title: "Escrow Contract 🔒",
        description: "Smart contract holds your funds safely during arbitrage execution",
        status: "Locked",
        details: [
          { label: "Locked Funds", value: "50 SST" },
          { label: "Contract Address", value: "0x5678...efgh" },
          { label: "Lock Duration", value: "Until execution complete" },
        ],
        action: {
          label: "Unlock Funds",
          variant: "outline"
        }
      },
      'dex-pool': {
        title: "DEX Pool (AOT/WETH) 🏦",
        description: "Uniswap V4 pool showing current liquidity and pricing",
        status: "Active",
        details: [
          { label: "Pool Price", value: "1 AOT = $0.95" },
          { label: "Liquidity", value: "500k AOT / 250 WETH" },
          { label: "24h Volume", value: "$2.1M" },
          { label: "Fee Tier", value: "0.3%" },
        ],
        action: {
          label: "View Pool Details",
          variant: "outline"
        }
      },
      oracle: {
        title: "Pyth Oracle Feed 📊",
        description: "Real-time price data from Pyth Network with cryptographic verification",
        status: "Verified",
        details: [
          { label: "WETH/USD", value: "$2000" },
          { label: "Derived AOT/USD", value: "$1.00" },
          { label: "Last Update", value: "2 seconds ago" },
          { label: "Confidence", value: "±$0.02" },
        ],
        action: {
          label: "Refresh Feed",
          variant: "outline"
        }
      },
      detector: {
        title: "Arbitrage Detector ⚡",
        description: "AI-powered system detects profitable arbitrage opportunities in real-time",
        status: "Opportunity Found",
        details: [
          { label: "Oracle Price", value: "$1.00 AOT" },
          { label: "Pool Price", value: "$0.95 AOT" },
          { label: "Price Difference", value: "+5.26%" },
          { label: "Profit Potential", value: "$0.05 per AOT" },
        ],
        action: {
          label: "Execute Arbitrage",
          variant: "default"
        }
      },
      swap: {
        title: "Swap Execution 🔄",
        description: "Smart contract automatically executes the arbitrage swap for maximum profit",
        status: "Ready",
        details: [
          { label: "Execution Path", value: "WETH → AOT (buy cheap)" },
          { label: "Expected Profit", value: "+5%" },
          { label: "Gas Cost", value: "~$12" },
          { label: "Slippage Tolerance", value: "0.5%" },
        ],
        action: {
          label: "Execute Swap",
          variant: "default"
        }
      },
      profit: {
        title: "Profit Return 💰",
        description: "Receive your arbitrage profits and unlock your original funds",
        status: "Pending",
        details: [
          { label: "Original Investment", value: "50 SST" },
          { label: "Arbitrage Profit", value: "+2.5 SST" },
          { label: "Total Return", value: "52.5 SST" },
          { label: "ROI", value: "+5%" },
        ],
        action: {
          label: "Withdraw Profit",
          variant: "default"
        }
      },
    };
    return details[nodeId] || details.wallet;
  };

  const currentDetails = getNodeDetails(selectedNode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-700/50">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-[rgb(178,255,238)] to-[rgb(30,255,195)] rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg">AFS</span>
          </div>
          <span className="text-white text-sm font-medium">ANTI FRAGILE SYSTEM</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
          <Link href="/arbitrage" className="text-gray-300 hover:text-white transition-colors">Arbitrage</Link>
          <span className="text-[rgb(178,255,238)] font-medium">Strategy Detail</span>
        </div>
      </nav>

      {/* Main Content - ReactFlow as Full Background */}
      <div className="relative h-[calc(100vh-80px)]">
        {/* ReactFlow covering entire page */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-blue-900/50 to-slate-800/50"
          defaultEdgeOptions={{
            style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
            type: 'smoothstep',
            animated: true,
          }}
        >
          <Controls className="!bg-slate-800/90 !border-slate-600 !backdrop-blur-sm" />
          <Background color="#334155" gap={20} />
        </ReactFlow>

        {/* Right Panel - Fixed Overlay */}
        <div className="absolute top-8 right-8 w-96 h-[calc(100%-4rem)] z-10">
          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-md h-full shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{currentDetails.title}</CardTitle>
                <Badge className={`${
                  currentDetails.status === 'Verified' || currentDetails.status === 'Connected' || currentDetails.status === 'Active' 
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : currentDetails.status === 'Opportunity Found'
                    ? 'bg-[rgb(30,255,195)]/20 text-[rgb(30,255,195)] border-[rgb(30,255,195)]/30'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                } text-xs px-2 py-1`}>
                  {currentDetails.status}
                </Badge>
              </div>
              <CardDescription className="text-gray-400">
                {currentDetails.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 overflow-y-auto h-[calc(100%-140px)]">
              {/* Details */}
              <div className="space-y-3">
                {currentDetails.details.map((detail: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-gray-400 text-sm">{detail.label}</span>
                    <span className="text-white font-medium text-sm">{detail.value}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Button 
                className={`w-full ${
                  currentDetails.action.variant === 'default'
                    ? 'bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900'
                    : 'bg-[rgb(30,255,195)]/10 hover:bg-[rgb(30,255,195)]/20 text-[rgb(178,255,238)] border border-[rgb(30,255,195)]/30 hover:border-[rgb(30,255,195)]/50'
                } transition-all font-semibold`}
                variant={currentDetails.action.variant === 'default' ? 'default' : 'outline'}
              >
                {currentDetails.action.label}
              </Button>

              {/* Additional Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                <div className="text-xs text-gray-500 mb-2">Step Information</div>
                <div className="text-sm text-gray-300">
                  {selectedNode === 'wallet' && "Connect your wallet to begin the arbitrage process."}
                  {selectedNode === 'escrow' && "Funds are safely locked in a smart contract during execution."}
                  {selectedNode === 'dex-pool' && "Monitor real-time pool data for arbitrage opportunities."}
                  {selectedNode === 'oracle' && "Verified price feeds ensure accurate arbitrage calculations."}
                  {selectedNode === 'detector' && "AI algorithms continuously scan for profitable opportunities."}
                  {selectedNode === 'swap' && "Automated execution ensures optimal timing and pricing."}
                  {selectedNode === 'profit' && "Receive your profits automatically after successful arbitrage."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
