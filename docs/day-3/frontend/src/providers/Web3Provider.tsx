"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { avalancheFuji } from "@reown/appkit/networks";
import { WagmiProvider, type Config } from "wagmi";
import { wagmiAdapter, projectId } from "../lib/wagmi";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

// Metadata untuk dApp
const metadata = {
  name: "Day 3 - Frontend dApp",
  description: "Avalanche Fuji Testnet dApp for learning",
  url: "http://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create Reown AppKit modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [avalancheFuji],
  defaultNetwork: avalancheFuji,
  metadata,
  features: {
    analytics: false,
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
