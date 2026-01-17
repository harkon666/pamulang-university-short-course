import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createPublicClient, http, PublicClient } from 'viem';
import { avalancheFuji } from 'viem/chains';
import SIMPLE_STORAGE from './simple-storage.json';

@Injectable()
export class BlockchainService {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor() {
    // Use environment variable or default RPC URL
    const rpcUrl =
      process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http(rpcUrl),
    });

    // Use environment variable for contract address
    this.contractAddress = (process.env.CONTRACT_ADDRESS ||
      '0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F') as `0x${string}`;

    console.log(`📍 Using contract: ${this.contractAddress}`);
    console.log(`🔗 Using RPC: ${rpcUrl}`);
  }

  // 🔹 Read latest value and owner
  async getLatestValue() {
    try {
      const value: bigint = (await this.client.readContract({
        address: this.contractAddress,
        abi: SIMPLE_STORAGE.abi,
        functionName: 'getValue',
      })) as bigint;

      const owner: string = (await this.client.readContract({
        address: this.contractAddress,
        abi: SIMPLE_STORAGE.abi,
        functionName: 'owner',
      })) as string;

      const blockNumber = await this.client.getBlockNumber();

      return {
        value: value.toString(),
        owner,
        blockNumber: blockNumber.toString(),
        contractAddress: this.contractAddress,
        network: 'Avalanche Fuji Testnet',
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Read ValueUpdated events
  async getValueUpdatedEvents(fromBlock: number, toBlock: number) {
    try {
      // Sebelum eksekusi logic pastikan (toBlock - fromBlock) < 2048
      // Jika lebih besar, kembalikan error ke client

      const events = await this.client.getLogs({
        address: this.contractAddress,
        event: {
          type: 'event',
          name: 'ValueUpdated',
          inputs: [
            {
              name: 'newValue',
              type: 'uint256',
              indexed: false,
            },
          ],
        },
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      return events.map((event) => ({
        blockNumber: event.blockNumber?.toString(),
        value: event.args.newValue?.toString(),
        txHash: event.transactionHash,
      }));
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Get current block number
  async getCurrentBlockNumber() {
    try {
      const blockNumber = await this.client.getBlockNumber();
      return {
        blockNumber: blockNumber.toString(),
        network: 'Avalanche Fuji Testnet',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Centralized RPC Error Handler
  private handleRpcError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);

    console.log({ error: message });

    if (message.includes('timeout')) {
      throw new ServiceUnavailableException(
        'RPC timeout. Silakan coba beberapa saat lagi.',
      );
    }

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed')
    ) {
      throw new ServiceUnavailableException(
        'Tidak dapat terhubung ke blockchain RPC.',
      );
    }

    throw new InternalServerErrorException(
      'Terjadi kesalahan saat membaca data blockchain.',
    );
  }
}
