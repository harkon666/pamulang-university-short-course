import { cookieStorage, createStorage } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Reown Project ID (temporary - will be removed)
export const projectId = "b6808bd11499531c85eddbf3cbc72e65";

if (!projectId) {
  throw new Error("REOWN_PROJECT_ID is not set");
}

// Supported networks
export const networks = [avalancheFuji];

// Wagmi Adapter untuk Reown
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
