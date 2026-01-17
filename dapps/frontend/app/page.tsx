'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { avalancheFuji } from 'wagmi/chains';
import { CONTRACT_ADDRESS, SIMPLE_STORAGE_ABI } from './lib/contract';
import { getBlockchainValue, type BlockchainValue } from './services/blockchain.service';

export default function Home() {
  // ==============================
  // 🔹 WALLET STATE
  // ==============================
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // ==============================
  // 🔹 LOCAL STATE
  // ==============================
  const [inputValue, setInputValue] = useState('');
  const [blockchainData, setBlockchainData] = useState<BlockchainValue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txMessage, setTxMessage] = useState('');

  // ==============================
  // 🔹 WRITE CONTRACT (via Wallet)
  // ==============================
  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // ==============================
  // 🔹 FETCH DATA FROM BACKEND
  // ==============================
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBlockchainValue();
      setBlockchainData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and auto-refresh after tx
  useEffect(() => {
    fetchData();
  }, []);

  // Auto switch network when connected to wrong chain
  useEffect(() => {
    if (isConnected && chainId !== avalancheFuji.id) {
      switchChain({ chainId: avalancheFuji.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Handle transaction status
  useEffect(() => {
    if (isWriting) {
      setTxStatus('pending');
      setTxMessage('Waiting for wallet confirmation...');
    } else if (isConfirming) {
      setTxStatus('pending');
      setTxMessage('Transaction pending...');
    } else if (isConfirmed) {
      setTxStatus('success');
      setTxMessage('Transaction confirmed!');
      fetchData(); // Refresh data from backend
      setInputValue('');
    } else if (writeError) {
      setTxStatus('error');
      setTxMessage(writeError.message.slice(0, 100) + '...');
    }
  }, [isWriting, isConfirming, isConfirmed, writeError]);

  // ==============================
  // 🔹 HANDLERS
  // ==============================
  const handleSetValue = () => {
    if (!inputValue) return;
    resetWrite();
    setTxStatus('idle');
    setTxMessage('');

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [BigInt(inputValue)],
    });
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isWrongNetwork = isConnected && chainId !== avalancheFuji.id;

  // ==============================
  // 🔹 UI
  // ==============================
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Full Stack dApp
          </h1>
          <p className="text-gray-400 mt-2">Avalanche Fuji Testnet</p>
          <p className="text-gray-500 text-sm mt-1">Frontend + Backend + Smart Contract</p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span>🔗</span>
            <span>Wallet Connection</span>
          </div>

          {!isConnected ? (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isConnecting}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-400">Connected Address</p>
                  <p className="font-mono text-sm">{shortenAddress(address!)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isWrongNetwork ? (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                      Wrong Network
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                      Fuji
                    </span>
                  )}
                </div>
              </div>

              {isWrongNetwork && (
                <button
                  onClick={() => switchChain({ chainId: avalancheFuji.id })}
                  disabled={isSwitching}
                  className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isSwitching ? 'Switching...' : 'Switch to Avalanche Fuji'}
                </button>
              )}

              <button
                onClick={() => disconnect()}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Read Data (via Backend API) */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span>📖</span>
              <span>Read Data (via Backend API)</span>
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              {isLoading ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {blockchainData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Stored Value</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {blockchainData.value}
                </p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Block Number</p>
                <p className="font-mono text-sm text-gray-300">
                  {blockchainData.blockNumber}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            📌 Data fetched from Backend API, not directly from RPC
          </p>
        </div>

        {/* Write Data (via Wallet Transaction) */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span>✍️</span>
            <span>Write Data (via Wallet)</span>
          </div>

          <div className="space-y-3">
            <input
              type="number"
              placeholder="Enter new value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full p-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
            />

            <button
              onClick={handleSetValue}
              disabled={isWriting || isConfirming || !isConnected || !inputValue}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWriting || isConfirming
                ? isWriting
                  ? 'Confirm in Wallet...'
                  : 'Confirming...'
                : 'Set Value'}
            </button>

            {/* Transaction Status */}
            {txStatus !== 'idle' && (
              <div
                className={`p-3 rounded-xl ${txStatus === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : txStatus === 'success'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
              >
                <p className="text-sm">{txMessage}</p>
                {txHash && (
                  <a
                    href={`https://testnet.snowtrace.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline opacity-75 hover:opacity-100"
                  >
                    View on Explorer
                  </a>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            📌 Transactions go directly to blockchain via your wallet
          </p>
        </div>

        {/* Architecture Info */}
        <div className="text-center text-xs text-gray-500 pt-4 space-y-1">
          <p>🔗 Contract: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</p>
          <p>Smart contract = single source of truth</p>
        </div>
      </div>
    </main>
  );
}
