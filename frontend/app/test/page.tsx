'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, ConnectButton } from 'thirdweb/react';
import { useEscrowContract, EscrowContractService } from '../../lib/escrow-contract';
import { client } from '../../lib/thirdweb';
import toast, { Toaster } from 'react-hot-toast';

export default function TestPage() {
  const account = useActiveAccount();
  const { getContract, getReadOnlyContract } = useEscrowContract();

  // Toast utility functions
  const showSuccessToast = (message: string, txHash: string) => {
    toast.success(
      <div>
        <div className="font-medium">{message}</div>
        <a 
          href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          View on Somnia Explorer →
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
  
  // State for form inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [markExecutedData, setMarkExecutedData] = useState({
    userAddress: '',
    returnedAmount: '',
    txReference: ''
  });
  const [refundAddress, setRefundAddress] = useState('');
  
  // State for displaying balances
  const [balances, setBalances] = useState({
    escrowBalance: '0',
    pendingReturns: '0',
    totalBalance: '0',
    contractBalance: '0'
  });
  
  // State for transaction status
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [networkInfo, setNetworkInfo] = useState<{name: string, chainId: number} | null>(null);

  // Refresh balances
  const refreshBalances = async () => {
    if (!account?.address) return;
    
    try {
      // Check if contract address is set
      if (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        setTxStatus('Contract address not configured. Please set NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS in .env');
        return;
      }
      
      const { contract, provider } = await getReadOnlyContract();
      
      // Check network and contract existence
      const network = await provider.getNetwork();
      setNetworkInfo({ name: network.name, chainId: Number(network.chainId) });
      setTxStatus(`Checking contract on ${network.name}...`);
      
      // Check if contract exists
      const contractCode = await provider.getCode(process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS!);
      if (contractCode === '0x') {
        setTxStatus(`❌ No contract found at address ${process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS} on ${network.name}`);
        return;
      }
      
      setTxStatus(`Contract found on ${network.name}. Fetching balances...`);
      
      const service = new EscrowContractService(contract, null as any);
      
      // Try to call each function individually to identify which one fails
      try {
        const escrowBalance = await service.getEscrowBalance(account.address);
        const pendingReturns = await service.getPendingReturns(account.address);
        const totalBalance = await service.getTotalBalance(account.address);
        const contractBalance = await service.getContractBalance();
        
        setBalances({
          escrowBalance,
          pendingReturns,
          totalBalance,
          contractBalance
        });
        
        setTxStatus(`✅ Balances updated successfully on ${network.name}`);
      } catch (contractError: any) {
        console.error('Contract call error:', contractError);
        setTxStatus(`Contract call failed: ${contractError.message}. Check if you're on the correct network.`);
      }
      
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      setTxStatus(`Error: ${error.message || error}`);
    }
  };

  // Auto-refresh balances when account changes
  useEffect(() => {
    if (account?.address) {
      refreshBalances();
    }
  }, [account?.address]);

  // Deposit function
  const handleDeposit = async () => {
    if (!depositAmount || !account?.address) return;
    
    setLoading(true);
    const loadingToastId = showLoadingToast(`Depositing ${depositAmount} STT...`);
    
    try {
      const { contract, signer } = await getContract();
      const service = new EscrowContractService(contract, signer);
      
      const tx = await service.deposit(depositAmount);
      
      // Update loading toast
      toast.loading('Waiting for transaction confirmation...', { id: loadingToastId });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showSuccessToast(`✅ Deposited ${depositAmount} STT successfully!`, tx.hash);
      setTxStatus(`Deposit successful! Block: ${receipt?.blockNumber}`);
      
      // Refresh balances
      await refreshBalances();
      setDepositAmount('');
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.dismiss(loadingToastId);
      showErrorToast(`Deposit failed: ${error.message}`);
      setTxStatus(`Deposit failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw function
  const handleWithdraw = async () => {
    if (!account?.address) return;
    
    // Check if there are pending returns to withdraw
    if (parseFloat(balances.pendingReturns) === 0) {
      showErrorToast('No pending returns to withdraw. You need to have funds marked as executed first.');
      setTxStatus('Cannot withdraw: No pending returns available');
      return;
    }
    
    setLoading(true);
    const loadingToastId = showLoadingToast(`Withdrawing ${balances.pendingReturns} STT...`);
    
    try {
      const { contract, signer } = await getContract();
      const service = new EscrowContractService(contract, signer);
      
      const tx = await service.withdraw();
      
      // Update loading toast
      toast.loading('Waiting for transaction confirmation...', { id: loadingToastId });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showSuccessToast(`✅ Withdrew ${balances.pendingReturns} STT successfully!`, tx.hash);
      setTxStatus(`Withdrawal successful! Block: ${receipt?.blockNumber}`);
      
      // Refresh balances
      await refreshBalances();
      
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast.dismiss(loadingToastId);
      
      // Better error handling
      if (error.message.includes('No pending returns')) {
        showErrorToast('No pending returns to withdraw. You need funds to be marked as executed first.');
        setTxStatus('Cannot withdraw: No pending returns available');
      } else {
        showErrorToast(`Withdrawal failed: ${error.message}`);
        setTxStatus(`Withdrawal failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark executed function (admin only)
  const handleMarkExecuted = async () => {
    if (!markExecutedData.userAddress || !markExecutedData.returnedAmount || !markExecutedData.txReference) return;
    
    setLoading(true);
    const loadingToastId = showLoadingToast(`Marking swap as executed for ${markExecutedData.userAddress.slice(0,6)}...`);
    
    try {
      const { contract, signer } = await getContract();
      const service = new EscrowContractService(contract, signer);
      
      const tx = await service.markExecuted(
        markExecutedData.userAddress,
        markExecutedData.returnedAmount,
        markExecutedData.txReference
      );
      
      // Update loading toast
      toast.loading('Waiting for transaction confirmation...', { id: loadingToastId });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showSuccessToast(`✅ Swap marked as executed for ${markExecutedData.userAddress.slice(0,6)}...${markExecutedData.userAddress.slice(-4)}`, tx.hash);
      setTxStatus(`Execution marked! Block: ${receipt?.blockNumber}`);
      
      // Refresh balances
      await refreshBalances();
      setMarkExecutedData({ userAddress: '', returnedAmount: '', txReference: '' });
      
    } catch (error: any) {
      console.error('Mark executed error:', error);
      toast.dismiss(loadingToastId);
      showErrorToast(`Mark executed failed: ${error.message}`);
      setTxStatus(`Mark executed failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Refund function (admin only)
  const handleRefund = async () => {
    if (!refundAddress) return;
    
    setLoading(true);
    const loadingToastId = showLoadingToast(`Processing emergency refund for ${refundAddress.slice(0,6)}...`);
    
    try {
      const { contract, signer } = await getContract();
      const service = new EscrowContractService(contract, signer);
      
      const tx = await service.refund(refundAddress);
      
      // Update loading toast
      toast.loading('Waiting for transaction confirmation...', { id: loadingToastId });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showSuccessToast(`✅ Emergency refund completed for ${refundAddress.slice(0,6)}...${refundAddress.slice(-4)}`, tx.hash);
      setTxStatus(`Refund successful! Block: ${receipt?.blockNumber}`);
      
      // Refresh balances
      await refreshBalances();
      setRefundAddress('');
      
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.dismiss(loadingToastId);
      showErrorToast(`Refund failed: ${error.message}`);
      setTxStatus(`Refund failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Escrow Contract Test</h1>
          <p className="mb-6 text-gray-600">Please connect your wallet to continue</p>
          <ConnectButton client={client} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Escrow Contract Test</h1>
          <div className="mb-4">
            <p><strong>Connected Address:</strong> {account.address}</p>
            <p><strong>Contract Address:</strong> {process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || 'Not configured'}</p>
            {networkInfo && (
              <p><strong>Network:</strong> {networkInfo.name} (Chain ID: {networkInfo.chainId})</p>
            )}
            {process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000' && (
              <p className="text-red-600 text-sm mt-1">
                ⚠️ Please set NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS in your .env file
              </p>
            )}
            <div className="mt-2">
              <ConnectButton client={client} />
            </div>
          </div>
        </div>

        {/* Balances Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Account Balances</h2>
            <button
              onClick={refreshBalances}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium text-gray-600">Escrow Balance</h3>
              <p className="text-xl font-semibold">{balances.escrowBalance} STT</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium text-gray-600">Pending Returns</h3>
              <p className="text-xl font-semibold">{balances.pendingReturns} STT</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium text-gray-600">Total Balance</h3>
              <p className="text-xl font-semibold">{balances.totalBalance} STT</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium text-gray-600">Contract Balance</h3>
              <p className="text-xl font-semibold">{balances.contractBalance} STT</p>
            </div>
          </div>
        </div>

        {/* User Functions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">User Functions</h2>
          
          {/* Deposit */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Deposit to Escrow</h3>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                placeholder="Amount in STT"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleDeposit}
                disabled={loading || !depositAmount}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                Deposit
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div>
            <h3 className="text-lg font-medium mb-2">Withdraw Pending Returns</h3>
            <p className="text-sm text-gray-600 mb-2">
              Available to withdraw: <span className="font-semibold">{balances.pendingReturns} STT</span>
            </p>
            <button
              onClick={handleWithdraw}
              disabled={loading || parseFloat(balances.pendingReturns) === 0}
              className={`px-6 py-2 rounded font-medium ${
                parseFloat(balances.pendingReturns) > 0 && !loading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {parseFloat(balances.pendingReturns) > 0 ? 'Withdraw' : 'No Funds to Withdraw'}
            </button>
            {parseFloat(balances.pendingReturns) === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Funds need to be marked as "executed" by an admin before you can withdraw them.
              </p>
            )}
          </div>
        </div>

        {/* Admin Functions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Admin Functions</h2>
          
          {/* Mark Executed */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Mark Swap Executed</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="User Address"
                value={markExecutedData.userAddress}
                onChange={(e) => setMarkExecutedData({...markExecutedData, userAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.001"
                placeholder="Returned Amount (STT)"
                value={markExecutedData.returnedAmount}
                onChange={(e) => setMarkExecutedData({...markExecutedData, returnedAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Transaction Reference"
                value={markExecutedData.txReference}
                onChange={(e) => setMarkExecutedData({...markExecutedData, txReference: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleMarkExecuted}
                disabled={loading || !markExecutedData.userAddress || !markExecutedData.returnedAmount || !markExecutedData.txReference}
                className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
              >
                Mark Executed
              </button>
            </div>
          </div>

          {/* Refund */}
          <div>
            <h3 className="text-lg font-medium mb-2">Emergency Refund</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="User Address to Refund"
                value={refundAddress}
                onChange={(e) => setRefundAddress(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRefund}
                disabled={loading || !refundAddress}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
              >
                Refund
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Transaction Status</h2>
            <div className={`p-4 rounded ${txStatus.includes('failed') ? 'bg-red-50 text-red-700' : 
              txStatus.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
              {txStatus}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}