'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Nav from "@/components/Nav";
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
import { ArbitrageInputNode } from "@/components/ArbitrageInputNode";

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
  arbitrageInput: ArbitrageInputNode,
};

export default function StrategyDetailPage() {
  const searchParams = useSearchParams();
  const strategyId = searchParams.get('id') || '1';
  
  const [selectedNode, setSelectedNode] = useState<string>('detector');
  const [swapAmount, setSwapAmount] = useState<number>(0);
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);
  const [canProceedToEscrow, setCanProceedToEscrow] = useState<boolean>(false);

  // Callback functions for the ArbitrageInputNode
  const handleAmountChange = useCallback((amount: number, profit: number) => {
    setSwapAmount(amount);
    setEstimatedProfit(profit);
    setCanProceedToEscrow(amount >= 0.01 && profit > 0); // Changed to WETH minimum
  }, []);

  const handleProceedToEscrow = useCallback(() => {
    if (canProceedToEscrow) {
      setSelectedNode('escrow');
      // Additional logic to proceed to escrow can be added here
    }
  }, [canProceedToEscrow]);

  // Define the flow nodes - Simplified 3-node flow
  const initialNodes: Node[] = [
    {
      id: 'detector',
      type: 'arbitrageInput',
      position: { x: 200, y: 100 },
      data: { 
        emoji: '⚡', 
        label: 'Arbitrage Detector', 
        subtitle: 'Opportunity Scanner',
        onAmountChange: handleAmountChange,
        onProceedToEscrow: handleProceedToEscrow,
      },
    },
    {
      id: 'escrow',
      type: 'custom',
      position: { x: 600, y: 100 },
      data: { 
        emoji: '🔒', 
        label: 'Escrow Fund', 
        subtitle: 'Secure Holdings' 
      },
    },
    {
      id: 'execute',
      type: 'custom',
      position: { x: 1000, y: 100 },
      data: { 
        emoji: '🔄', 
        label: 'Execute Swap', 
        subtitle: 'Complete Trade' 
      },
    },
  ];

  // Define the edges - Simplified 2 edges for 3-node flow
  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'detector',
      target: 'escrow',
      type: 'smoothstep',
      style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
      animated: true,
    },
    {
      id: 'e2-3',
      source: 'escrow',
      target: 'execute',
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

  // Get details for selected node - Updated for 3-node flow
  const getNodeDetails = (nodeId: string) => {
    const details: Record<string, any> = {
      detector: {
        title: "Arbitrage Detector ⚡",
        description: "Configure your WETH swap amount and review profit calculations before proceeding to escrow",
        status: swapAmount > 0 ? (canProceedToEscrow ? "Ready to Proceed" : "Insufficient Profit") : "Enter WETH Amount",
        details: [
          { label: "AOT Oracle Price", value: "$1,852.50" },
          { label: "AOT Pool Price", value: "$1,847.23" },
          { label: "Profit per AOT", value: "+$5.27" },
          { label: "WETH Swap Amount", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} WETH` : "Not set" },
          { label: "Estimated Profit", value: swapAmount > 0 ? `$${estimatedProfit.toFixed(2)}` : "Calculating..." },
        ],
        action: {
          label: canProceedToEscrow ? "Proceed to Escrow" : "Set WETH Amount First",
          variant: canProceedToEscrow ? "default" : "disabled"
        }
      },
      escrow: {
        title: "Escrow Fund 🔒",
        description: "Deposit STT tokens as collateral for the WETH/AOT arbitrage trade execution",
        status: swapAmount > 0 ? "Ready for STT Deposit" : "Awaiting WETH Amount",
        details: [
          { label: "WETH Trade Amount", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} WETH` : "Set WETH amount first" },
          { label: "Required STT Collateral", value: swapAmount > 0 ? `${(swapAmount * 1847.23).toFixed(2)} STT` : "TBD" },
          { label: "Current STT Balance", value: "0 STT" },
          { label: "Expected STT Return", value: swapAmount > 0 ? `${(swapAmount * 1847.23 + estimatedProfit).toFixed(2)} STT` : "TBD" },
          { label: "Contract Address", value: "0x5678...efgh" },
        ],
        action: {
          label: swapAmount > 0 ? "Deposit STT Collateral" : "Set WETH Amount First",
          variant: swapAmount > 0 ? "default" : "disabled"
        }
      },
      execute: {
        title: "Execute Swap 🔄",
        description: "Execute WETH→AOT arbitrage trade with profit returned to your STT escrow balance",
        status: swapAmount > 0 ? "Ready to Execute" : "Awaiting Setup",
        details: [
          { label: "WETH Swap Amount", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} WETH` : "Not set" },
          { label: "STT Collateral", value: swapAmount > 0 ? `${(swapAmount * 1847.23).toFixed(2)} STT` : "Not set" },
          { label: "Execution Path", value: "WETH → AOT → Oracle Sale" },
          { label: "Expected Profit", value: swapAmount > 0 ? `$${estimatedProfit.toFixed(2)}` : "TBD" },
          { label: "Execution Time", value: "~30 seconds" },
        ],
        action: {
          label: swapAmount > 0 ? "Execute Arbitrage" : "Complete Setup First",
          variant: swapAmount > 0 ? "default" : "disabled"
        }
      },
    };
    return details[nodeId] || details.detector;
  };

  const currentDetails = getNodeDetails(selectedNode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Nav />

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
                    : currentDetails.action.variant === 'disabled'
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-[rgb(30,255,195)]/10 hover:bg-[rgb(30,255,195)]/20 text-[rgb(178,255,238)] border border-[rgb(30,255,195)]/30 hover:border-[rgb(30,255,195)]/50'
                } transition-all font-semibold`}
                variant={currentDetails.action.variant === 'default' ? 'default' : 'outline'}
                disabled={currentDetails.action.variant === 'disabled'}
                onClick={() => {
                  if (selectedNode === 'detector' && canProceedToEscrow) {
                    handleProceedToEscrow();
                  } else if (selectedNode === 'escrow' && swapAmount > 0) {
                    setSelectedNode('execute');
                  }
                  // Add more action handlers as needed
                }}
              >
                {currentDetails.action.label}
              </Button>

              {/* Additional Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                <div className="text-xs text-gray-500 mb-2">Step Information</div>
                <div className="text-sm text-gray-300">
                  {selectedNode === 'detector' && "AI algorithms continuously scan DEX pools and oracle feeds to identify profitable arbitrage opportunities in real-time."}
                  {selectedNode === 'escrow' && "Smart contract securely holds your funds during execution with automated release upon completion or failure."}
                  {selectedNode === 'execute' && "Automated execution ensures optimal timing, minimal slippage, and maximum profit extraction from arbitrage opportunities."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
