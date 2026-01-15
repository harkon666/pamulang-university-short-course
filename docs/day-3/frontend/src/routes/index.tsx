import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  useAccount,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { avalancheFuji } from "wagmi/chains";
import { CONTRACT_ADDRESS, SIMPLE_STORAGE_ABI } from "../lib/contract";
import { Wallet, RefreshCw, Send, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  // ==============================
  // 🔹 WALLET STATE (Reown AppKit)
  // ==============================
  const { address, isConnected } = useAccount();
  const { open } = useAppKit(); // Reown modal
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // ==============================
  // 🔹 LOCAL STATE
  // ==============================
  const [inputValue, setInputValue] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");

  // ==============================
  // 🔹 READ CONTRACT
  // ==============================
  const {
    data: storedValue,
    isLoading: isReading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: "getValue",
    chainId: avalancheFuji.id,
  });

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: "owner",
    chainId: avalancheFuji.id,
  });

  // ==============================
  // 🔹 WRITE CONTRACT
  // ==============================
  const {
    writeContract,
    data: txHash,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Auto switch to Avalanche Fuji when connected to wrong network
  useEffect(() => {
    if (isConnected && chainId !== avalancheFuji.id) {
      switchChain({ chainId: avalancheFuji.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Handle transaction status updates
  useEffect(() => {
    if (isWriting) {
      setTxStatus("pending");
      setTxMessage("Waiting for wallet confirmation...");
    } else if (isConfirming) {
      setTxStatus("pending");
      setTxMessage("Transaction pending...");
    } else if (isConfirmed) {
      setTxStatus("success");
      setTxMessage("Transaction confirmed!");
      refetch(); // Refresh value after successful tx
      setInputValue("");
    } else if (writeError) {
      setTxStatus("error");
      setTxMessage(writeError.message.slice(0, 100) + "...");
    }
  }, [isWriting, isConfirming, isConfirmed, writeError, refetch]);

  const handleSetValue = () => {
    if (!inputValue) return;
    resetWrite();
    setTxStatus("idle");
    setTxMessage("");

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SIMPLE_STORAGE_ABI,
      functionName: "setValue",
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
            Day 3 – Frontend dApp
          </h1>
          <p className="text-gray-400 mt-2">Avalanche Fuji Testnet</p>
        </div>

        {/* Wallet Connection Card */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Wallet size={20} className="text-cyan-400" />
            <span>Step 1: Wallet Connection</span>
          </div>

          {!isConnected ? (
            <button
              onClick={() => open()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200"
            >
              Connect Wallet
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

              {/* Switch Network Button */}
              {isWrongNetwork && (
                <button
                  onClick={() => switchChain({ chainId: avalancheFuji.id })}
                  disabled={isSwitching}
                  className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={16} />
                  {isSwitching ? "Switching..." : "Switch to Avalanche Fuji"}
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

        {/* Read Contract Card */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw size={20} className="text-green-400" />
              <span>Step 2: Read Contract</span>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh value"
            >
              <RefreshCw size={16} className={isReading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Stored Value</p>
              {isReading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-cyan-400">
                  {storedValue?.toString() ?? "0"}
                </p>
              )}
            </div>
            <div className="p-4 bg-gray-900/50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Contract Owner</p>
              <p className="font-mono text-sm text-gray-300">
                {owner ? shortenAddress(owner) : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Write Contract Card */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Send size={20} className="text-blue-400" />
            <span>Step 3: Write Contract</span>
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
              {isWriting || isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {isWriting ? "Confirm in Wallet..." : "Confirming..."}
                </span>
              ) : (
                "Set Value"
              )}
            </button>

            {/* Transaction Status */}
            {txStatus !== "idle" && (
              <div
                className={`p-3 rounded-xl flex items-start gap-2 ${txStatus === "pending"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : txStatus === "success"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                  }`}
              >
                {txStatus === "pending" && <Loader2 size={18} className="animate-spin mt-0.5" />}
                {txStatus === "success" && <CheckCircle size={18} className="mt-0.5" />}
                {txStatus === "error" && <XCircle size={18} className="mt-0.5" />}
                <div className="flex-1">
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
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 pt-4">
          Smart contract = single source of truth 🔗
        </p>
      </div>
    </main>
  );
}
