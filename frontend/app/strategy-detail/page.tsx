'use client';

import { useState, useCallback, useEffect } from 'react';
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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArbitrageInputNode } from "@/components/ArbitrageInputNode";

// Custom Node Component
const CustomNode = ({ data, selected, id }: any) => {
  return (
    <div 
      className={`px-4 py-3 rounded-lg border-2 min-w-[120px] text-center transition-all relative cursor-pointer ${
        selected 
          ? 'border-[rgb(30,255,195)] bg-[rgb(30,255,195)]/20 shadow-lg shadow-[rgb(30,255,195)]/25' 
          : 'border-slate-600 bg-slate-800/90 hover:border-[rgb(178,255,238)] hover:bg-slate-800'
      }`}
      onClick={(e) => {
        console.log(`🎯 CustomNode direct click: ${data.label} (${id})`);
        if (data.onNodeClick) {
          data.onNodeClick(id);
        }
        e.stopPropagation();
      }}
    >
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

// Main Flow Component (with ReactFlow context)
function StrategyFlow() {
  const reactFlowInstance = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<string>('detector');
  const [swapAmount, setSwapAmount] = useState<number>(0);
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);
  const [canProceedToEscrow, setCanProceedToEscrow] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);

  // Callback functions for the ArbitrageInputNode
  const handleAmountChange = useCallback((amount: number, profit: number) => {
    setSwapAmount(amount);
    setEstimatedProfit(profit);
    setCanProceedToEscrow(amount >= 0.01 && profit > 0); // Changed to WETH minimum
  }, []);

  // Define the edges first - no dependencies
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

  // Initialize with temporary nodes first
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Function to smoothly focus on a specific node
  const focusOnNode = useCallback((nodeId: string) => {
    const node = reactFlowInstance.getNode(nodeId);
    if (node) {
      console.log(`🎯 Focusing on node: ${nodeId}`); // Debug log
      
      // Set the selected node
      setSelectedNode(nodeId);
      
      // Update nodes to reflect the selected state with a slight animation delay
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      
      // First phase: Fit view to target node with smooth animation
      reactFlowInstance.fitView({
        nodes: [node],
        duration: 800, // Animation duration in ms
        padding: 0.3, // Padding around the focused node
      });
      
      // Second phase: Center and zoom with enhanced effect
      setTimeout(() => {
        if (node.position) {
          reactFlowInstance.setCenter(
            node.position.x + (node.width || 160) / 2,
            node.position.y + (node.height || 100) / 2,
            { duration: 600, zoom: 1.3 } // Slightly more zoom and longer duration
          );
        }
      }, 300); // Slightly longer delay for better effect
    }
  }, [reactFlowInstance, setNodes, setSelectedNode]);

  // Define handleProceedToEscrow after focusOnNode
  const handleProceedToEscrow = useCallback(() => {
    if (canProceedToEscrow) {
      // Smoothly focus on the escrow node
      focusOnNode('escrow');
    }
  }, [canProceedToEscrow, focusOnNode]);

  // Initialize nodes after all callbacks are defined
  useEffect(() => {
    const initialNodes: Node[] = [
      {
        id: 'detector',
        type: 'arbitrageInput',
        position: { x: 200, y: 100 },
        selected: true, // Initially selected
        data: { 
          emoji: '⚡', 
          label: 'Arbitrage Detector', 
          subtitle: 'Opportunity Scanner',
          onAmountChange: handleAmountChange,
          onProceedToEscrow: handleProceedToEscrow,
          onNodeClick: focusOnNode,
        },
      },
      {
        id: 'escrow',
        type: 'custom',
        position: { x: 600, y: 100 },
        selected: false,
        data: { 
          emoji: '🔒', 
          label: 'Escrow Fund', 
          subtitle: 'Secure Holdings',
          onNodeClick: focusOnNode,
        },
      },
      {
        id: 'execute',
        type: 'custom',
        position: { x: 1000, y: 100 },
        selected: false,
        data: { 
          emoji: '🔄', 
          label: 'Execute Swap', 
          subtitle: 'Complete Trade',
          onNodeClick: focusOnNode,
        },
      },
    ];
    
    setNodes(initialNodes);
  }, [handleAmountChange, handleProceedToEscrow, focusOnNode, setNodes]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node click with debugging
  const onNodeClick = useCallback((event: any, node: Node) => {
    console.log(`🖱️ ReactFlow Node clicked: ${node.id}`, event, node); // Debug log
    console.log(`🔄 About to call focusOnNode for: ${node.id}`);
    focusOnNode(node.id);
    console.log(`✅ focusOnNode called for: ${node.id}`);
  }, [focusOnNode]);

  // Handle node double click as backup
  const onNodeDoubleClick = useCallback((event: any, node: Node) => {
    console.log(`🖱️ Node double-clicked: ${node.id}`, node); // Debug log
    focusOnNode(node.id);
  }, [focusOnNode]);

  // Add logging when component mounts
  useEffect(() => {
    console.log('🚀 StrategyFlow component mounted, ReactFlow instance:', reactFlowInstance);
  }, [reactFlowInstance]);

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
          { label: "Required STT Collateral", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} STT` : "TBD" },
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
    <>
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
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-blue-900/50 to-slate-800/50"
          defaultEdgeOptions={{
            style: { stroke: 'rgb(178,255,238)', strokeWidth: 3 },
            type: 'smoothstep',
            animated: true,
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
        >
          <Controls className="!bg-slate-800/90 !border-slate-600 !backdrop-blur-sm" />
          <Background color="#334155" gap={20} />
        </ReactFlow>

        {/* Right Panel - Fixed Overlay with Vertical Collapse */}
        <div className={`absolute top-8 right-8 w-96 z-10 transition-all duration-300 ${
          isPanelCollapsed 
            ? 'h-16' 
            : 'h-[calc(100%-4rem)]'
        }`}>
          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-md h-full shadow-2xl relative">
            {/* Toggle Button */}
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="absolute top-2 right-2 z-20 w-8 h-8 bg-slate-700/80 hover:bg-slate-600/80 rounded-full flex items-center justify-center transition-all text-white"
            >
              <span className={`transform transition-transform duration-300 ${
                isPanelCollapsed ? 'rotate-180' : 'rotate-0'
              }`}>
                {isPanelCollapsed ? '↓' : '↑'}
              </span>
            </button>

            {!isPanelCollapsed && (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between pr-10">
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
                    focusOnNode('execute');
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
              </>
            )}

            {/* Collapsed State - Show Node Info Horizontally */}
            {isPanelCollapsed && (
              <div className="flex items-center justify-between px-4 h-full">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {selectedNode === 'detector' && '⚡'}
                    {selectedNode === 'escrow' && '🔒'}
                    {selectedNode === 'execute' && '🔄'}
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {currentDetails.title.split(' ')[0]} {/* Show first word of title */}
                  </div>
                </div>
                <Badge className={`${
                  currentDetails.status === 'Verified' || currentDetails.status === 'Connected' || currentDetails.status === 'Active' 
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : currentDetails.status === 'Opportunity Found'
                    ? 'bg-[rgb(30,255,195)]/20 text-[rgb(30,255,195)] border-[rgb(30,255,195)]/30'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                } text-xs px-2 py-1 mr-10`}>
                  {currentDetails.status.split(' ')[0]} {/* Show first word of status */}
                </Badge>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

// Main wrapper component
export default function StrategyDetailPage() {
  const searchParams = useSearchParams();
  const strategyId = searchParams.get('id') || '1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Nav />
      <ReactFlow
        nodeTypes={nodeTypes}
        fitView
      >
        <StrategyFlow />
      </ReactFlow>
    </div>
  );
}
