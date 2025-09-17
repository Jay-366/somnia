'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Nav from "@/components/Nav";
import { useSearchParams } from 'next/navigation';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { useEscrowContract, EscrowContractService } from '../../lib/escrow-contract';
import { useExecutorVaultContract, ExecutorVaultService } from '../../lib/executor-vault-contract';
import { ContractClient, CONTRACT_ADDRESSES } from '../../lib/contracts';
import { getNetworkById } from '../../lib/networks';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
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
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { getContract } = useEscrowContract();
  const { getContract: getExecutorContract } = useExecutorVaultContract();
  const [selectedNode, setSelectedNode] = useState<string>('detector');
  const [swapAmount, setSwapAmount] = useState<number>(0);
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);
  const [canProceedToEscrow, setCanProceedToEscrow] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [isSepoliaNetwork, setIsSepoliaNetwork] = useState(false);
  const [depositStatus, setDepositStatus] = useState<{
    success: boolean;
    txHash: string;
    amount: string;
    message: string;
  } | null>(null);
  const [swapStatus, setSwapStatus] = useState<{
    success: boolean;
    txHash: string;
    wethReceived: string;
    message: string;
  } | null>(null);

  // Toast utility functions
  const showSuccessToast = (message: string, txHash: string, isSepolia: boolean = false) => {
    const explorerUrl = isSepolia 
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : `https://shannon-explorer.somnia.network/tx/${txHash}`;
    const explorerName = isSepolia ? "Sepolia Etherscan" : "Somnia Explorer";
    
    toast.success(
      <div>
        <div className="font-medium">{message}</div>
        <a 
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-200 hover:text-blue-100 text-sm underline"
        >
          View on {explorerName} →
        </a>
      </div>,
      {
        duration: 6000,
        position: 'top-right',
      }
    );
  };

  const showErrorToast = (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });
  };

  const showLoadingToast = (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  };

  // Check if user is on Sepolia network
  useEffect(() => {
    const checkNetwork = async () => {
      if (wallet) {
        try {
          const chain = wallet.getChain();
          const chainId = chain?.id;
          setIsSepoliaNetwork(chainId === 11155111); // Sepolia chain ID
        } catch (error) {
          console.error('Failed to get network info:', error);
          setIsSepoliaNetwork(false);
        }
      }
    };
    checkNetwork();
  }, [wallet]);

  // Execute AOT → WETH swap on Sepolia
  const executeSwap = async () => {
    if (!account?.address || swapAmount <= 0) {
      showErrorToast('Please connect wallet and set AOT amount first');
      return;
    }

    // Check if on Sepolia network
    if (!isSepoliaNetwork) {
      showErrorToast('Please switch to Sepolia network to execute the swap. The ExecutorVault is deployed on Sepolia.');
      // You could add network switching prompt here
      return;
    }

    setSwapLoading(true);
    const loadingToastId = showLoadingToast(`Executing ${swapAmount.toFixed(4)} AOT → WETH swap...`);

    try {
      const { contract, signer } = await getExecutorContract();
      const vaultService = new ExecutorVaultService(contract, signer);
      const contractClient = new ContractClient(undefined, signer);
      
      // First approve AOT spending
      const aotContract = contractClient.getERC20Contract(CONTRACT_ADDRESSES.AOT_TOKEN, true);
      
      // Check if approval is needed
      const currentAllowance = await aotContract.allowance(account.address, CONTRACT_ADDRESSES.EXECUTOR_VAULT);
      const swapAmountWei = ethers.parseEther(swapAmount.toString());
      
      if (currentAllowance < swapAmountWei) {
        toast.loading('Approving AOT spending...', { id: loadingToastId });
        const approveTx = await aotContract.approve(CONTRACT_ADDRESSES.EXECUTOR_VAULT, ethers.MaxUint256);
        await approveTx.wait();
      }
      
      // Check vault balances before swap
      const vaultBalances = await vaultService.getUserBalances(account.address);
      if (parseFloat(vaultBalances.aotBalance) < swapAmount) {
        throw new Error(`Insufficient AOT balance in vault. Available: ${vaultBalances.aotBalance}, Required: ${swapAmount}`);
      }
      
      // Execute swap
      toast.loading('Executing AOT → WETH swap...', { id: loadingToastId });
      const swapTx = await vaultService.executeSwap(swapAmount.toString());
      
      // Wait for confirmation
      const receipt = await swapTx.wait();
      
      // Calculate WETH received (simplified calculation)
      const wethReceived = (swapAmount * (1847.23 / 1847.23)).toFixed(4);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showSuccessToast(`✅ Swapped ${swapAmount.toFixed(4)} AOT to ${wethReceived} WETH successfully!`, swapTx.hash, true);
      
      // Update swap status for right panel
      setSwapStatus({
        success: true,
        txHash: swapTx.hash,
        wethReceived: wethReceived,
        message: `Successfully swapped ${swapAmount.toFixed(4)} AOT to ${wethReceived} WETH`
      });
      
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.dismiss(loadingToastId);
      
      let errorMessage = 'Unknown error';
      if (error.message?.includes('insufficient')) {
        errorMessage = error.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transaction reverted. This could be due to insufficient liquidity, slippage, or pool configuration issues.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(`Swap failed: ${errorMessage}`);
      
      // Update swap status for right panel with error
      setSwapStatus({
        success: false,
        txHash: '',
        wethReceived: '0',
        message: `Swap failed: ${errorMessage}`
      });
    } finally {
      setSwapLoading(false);
    }
  };

  // Deposit STT to escrow contract
  const handleDepositSTT = async () => {
    if (!account?.address || swapAmount <= 0) {
      showErrorToast('Please connect wallet and set AOT amount first');
      return;
    }
    
    setLoading(true);
    const collateralAmount = (swapAmount * 1847.23).toFixed(4); // Calculate STT collateral needed
    const loadingToastId = showLoadingToast(`Depositing ${collateralAmount} STT collateral...`);
    
    try {
      const { contract, signer } = await getContract();
      const service = new EscrowContractService(contract, signer);
      
      const tx = await service.deposit(collateralAmount);
      
      // Update loading toast
      toast.loading('Waiting for transaction confirmation...', { id: loadingToastId });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showSuccessToast(`✅ Deposited ${collateralAmount} STT collateral successfully!`, tx.hash);
      
      // Update deposit status for right panel
      setDepositStatus({
        success: true,
        txHash: tx.hash,
        amount: collateralAmount,
        message: `Successfully deposited ${collateralAmount} STT collateral`
      });
      
      // Move to execute node after successful deposit
      setTimeout(() => {
        focusOnNode('execute');
      }, 1000);
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.dismiss(loadingToastId);
      showErrorToast(`Deposit failed: ${error.message}`);
      
      // Update deposit status for right panel with error
      setDepositStatus({
        success: false,
        txHash: '',
        amount: collateralAmount,
        message: `Deposit failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Callback functions for the ArbitrageInputNode
  const handleAmountChange = useCallback((amount: number, profit: number) => {
    setSwapAmount(amount);
    setEstimatedProfit(profit);
    setCanProceedToEscrow(amount > 0 && profit > 0); // Remove minimum amount restriction
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
        description: "Configure your AOT swap amount and review profit calculations before proceeding to escrow",
        status: swapAmount > 0 ? (canProceedToEscrow ? "Ready to Proceed" : "Insufficient Profit") : "Enter AOT Amount",
        details: [
          { label: "WETH Oracle Price", value: "$1,852.50" },
          { label: "WETH Pool Price", value: "$1,847.23" },
          { label: "Profit per WETH", value: "+$5.27" },
          { label: "AOT Swap Amount", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} AOT` : "Not set" },
          { label: "Estimated Profit", value: swapAmount > 0 ? `$${estimatedProfit.toFixed(2)}` : "Calculating..." },
        ],
        action: {
          label: canProceedToEscrow ? "Proceed to Escrow" : "Set AOT Amount First",
          variant: canProceedToEscrow ? "default" : "disabled"
        }
      },
      escrow: {
        title: "Escrow Fund 🔒",
        description: "Deposit STT tokens as collateral for the AOT/WETH arbitrage trade execution",
        status: depositStatus?.success ? "Deposit Successful ✅" : 
               depositStatus?.success === false ? "Deposit Failed ❌" :
               swapAmount > 0 ? "Ready for STT Deposit" : "Awaiting AOT Amount",
        details: [
          { label: "AOT Trade Amount", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} AOT` : "Set AOT amount first" },
          { label: "Required STT Collateral", value: swapAmount > 0 ? `${(swapAmount * 1847.23).toFixed(4)} STT` : "TBD" },
          { label: "Contract Address", value: process.env.NEXT_PUBLIC_ESCROW_ADDRESS?.slice(0, 6) + "..." + process.env.NEXT_PUBLIC_ESCROW_ADDRESS?.slice(-4) || "Not configured" },
          ...(depositStatus ? [
            { label: "Transaction Status", value: depositStatus.message },
            ...(depositStatus.success ? [
              { 
                label: "Transaction Hash", 
                value: depositStatus.txHash.slice(0, 10) + "..." + depositStatus.txHash.slice(-8),
                isLink: true,
                href: `https://shannon-explorer.somnia.network/tx/${depositStatus.txHash}`
              }
            ] : [])
          ] : [])
        ],
        action: {
          label: depositStatus?.success ? "Proceed to Execute" : 
                swapAmount > 0 ? "Deposit STT Collateral" : "Set AOT Amount First",
          variant: depositStatus?.success ? "success" : 
                  swapAmount > 0 ? "default" : "disabled"
        }
      },
      execute: {
        title: "Execute Swap 🔄",
        description: "Execute AOT→WETH arbitrage trade via DEX pool with profit returned to your account",
        status: swapStatus?.success ? "Swap Completed ✅" :
               swapStatus?.success === false ? "Swap Failed ❌" :
               depositStatus?.success && isSepoliaNetwork ? "Ready to Execute" :
               depositStatus?.success && !isSepoliaNetwork ? "Switch to Sepolia Required" :
               swapAmount > 0 ? "Awaiting Collateral Deposit" : "Awaiting Setup",
        details: [
          { label: "AOT Input Amount", value: swapAmount > 0 ? `${swapAmount.toFixed(4)} AOT` : "Not set" },
          { label: "WETH Output Amount", value: swapAmount > 0 ? `${(swapAmount * (1847.23 / 1847.23)).toFixed(4)} WETH` : "Not set" },
          { label: "Execution Path", value: "AOT → DEX Pool → WETH to User" },
          { label: "Network Status", value: isSepoliaNetwork ? "✅ Sepolia Connected" : "❌ Switch to Sepolia Required" },
          { label: "STT Collateral Status", value: depositStatus?.success ? "✅ Deposited" : "⏳ Pending" },
          { label: "Expected Net Profit", value: swapAmount > 0 ? `$${estimatedProfit.toFixed(2)}` : "TBD" },
          ...(swapStatus ? [
            { label: "Swap Status", value: swapStatus.message },
            ...(swapStatus.success ? [
              { 
                label: "Transaction Hash", 
                value: swapStatus.txHash.slice(0, 10) + "..." + swapStatus.txHash.slice(-8),
                isLink: true,
                href: `https://sepolia.etherscan.io/tx/${swapStatus.txHash}`
              },
              { label: "WETH Received", value: `${swapStatus.wethReceived} WETH` }
            ] : [])
          ] : [
            { label: "Pool Fee", value: "0.3%" },
            { label: "Slippage Tolerance", value: "2%" },
            { label: "Execution Time", value: "~15-30 seconds" }
          ])
        ],
        action: {
          label: swapStatus?.success ? "Swap Completed ✅" :
                !isSepoliaNetwork ? "Switch to Sepolia Network" :
                !depositStatus?.success ? "Deposit Collateral First" :
                "Execute AOT→WETH Swap",
          variant: swapStatus?.success ? "success" :
                  depositStatus?.success && isSepoliaNetwork ? "default" : "disabled"
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
                    {detail.isLink ? (
                      <a
                        href={detail.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[rgb(30,255,195)] hover:text-[rgb(178,255,238)] font-medium text-sm underline transition-colors"
                      >
                        {detail.value}
                      </a>
                    ) : (
                      <span className={`font-medium text-sm ${
                        detail.label === "Transaction Status" 
                          ? depositStatus?.success 
                            ? "text-green-400" 
                            : "text-red-400"
                          : detail.label === "Swap Status"
                          ? swapStatus?.success
                            ? "text-green-400"
                            : "text-red-400"
                          : detail.label === "Network Status"
                          ? isSepoliaNetwork
                            ? "text-green-400"
                            : "text-red-400"
                          : "text-white"
                      }`}>
                        {detail.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Button 
                className={`w-full ${
                  currentDetails.action.variant === 'default'
                    ? 'bg-[rgb(30,255,195)] hover:bg-[rgb(178,255,238)] text-slate-900'
                    : currentDetails.action.variant === 'success'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : currentDetails.action.variant === 'disabled'
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-[rgb(30,255,195)]/10 hover:bg-[rgb(30,255,195)]/20 text-[rgb(178,255,238)] border border-[rgb(30,255,195)]/30 hover:border-[rgb(30,255,195)]/50'
                } transition-all font-semibold`}
                variant={currentDetails.action.variant === 'default' ? 'default' : 'outline'}
                disabled={currentDetails.action.variant === 'disabled' || loading || swapLoading}
                onClick={() => {
                  if (selectedNode === 'detector' && canProceedToEscrow) {
                    handleProceedToEscrow();
                  } else if (selectedNode === 'escrow') {
                    if (depositStatus?.success) {
                      // Move to execute node if deposit was successful
                      focusOnNode('execute');
                    } else if (swapAmount > 0) {
                      // Call the actual deposit function
                      handleDepositSTT();
                    }
                  } else if (selectedNode === 'execute') {
                    if (swapStatus?.success) {
                      // Already completed
                      return;
                    } else if (!isSepoliaNetwork) {
                      showErrorToast('Please switch to Sepolia network to execute the swap');
                    } else if (depositStatus?.success && swapAmount > 0) {
                      // Execute the actual swap
                      executeSwap();
                    }
                  }
                }}
              >
                {loading && selectedNode === 'escrow' ? 'Depositing...' : 
                 swapLoading && selectedNode === 'execute' ? 'Executing Swap...' : 
                 currentDetails.action.label}
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
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
          success: {
            duration: 6000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
            },
          },
        }}
      />
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
