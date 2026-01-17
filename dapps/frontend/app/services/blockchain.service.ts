// Blockchain Service - Fetches data from backend API
// Frontend does NOT directly call RPC, it uses backend as a proxy

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn('NEXT_PUBLIC_BACKEND_URL is not defined, using default');
}

const API_BASE = BACKEND_URL || 'http://localhost:3001';

export interface BlockchainValue {
  value: string;
  owner?: string;
  blockNumber?: string;
  contractAddress?: string;
  network?: string;
  updatedAt?: string;
}

export interface BlockchainEvent {
  blockNumber: string;
  value?: string;
  newValue?: string;
  txHash: string;
}

export interface EventsResponse {
  events: BlockchainEvent[];
  totalEvents: number;
  fromBlock: number;
  toBlock: number;
  contractAddress: string;
}

/**
 * Get latest blockchain value from backend
 * (Read via Backend API instead of direct RPC call)
 */
export async function getBlockchainValue(): Promise<BlockchainValue> {
  const res = await fetch(`${API_BASE}/blockchain/value`, {
    method: 'GET',
    cache: 'no-store', // Always get fresh data
  });

  if (!res.ok) {
    throw new Error('Failed to fetch blockchain value');
  }

  return res.json();
}

/**
 * Get blockchain events from backend
 */
export async function getBlockchainEvents(
  fromBlock: number,
  toBlock: number
): Promise<EventsResponse> {
  const res = await fetch(`${API_BASE}/blockchain/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fromBlock, toBlock }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch blockchain events');
  }

  return res.json();
}

/**
 * Get current block number
 */
export async function getCurrentBlock(): Promise<{ blockNumber: string }> {
  const res = await fetch(`${API_BASE}/blockchain/block`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch block number');
  }

  return res.json();
}
