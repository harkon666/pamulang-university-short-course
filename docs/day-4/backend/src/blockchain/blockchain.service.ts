import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import SIMPLE_STORAGE from './simple-storage.json';

@Injectable()
export class BlockchainService {
  private client: ReturnType<typeof createPublicClient>;
  private contractAddress: `0x${string}`;
  private abi = SIMPLE_STORAGE.abi as const;

  constructor() {
    // Setup viem public client for Avalanche Fuji Testnet
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http('https://api.avax-test.network/ext/bc/C/rpc', {
        timeout: 10_000, // 10 seconds timeout
      }),
    });

    // Contract address dari Day 2 deployment
    this.contractAddress =
      '0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F' as `0x${string}`;
  }

  // 🔹 Task 2: Read latest value from contract
  async getLatestValue() {
    try {
      const value = await this.client.readContract({
        address: this.contractAddress,
        abi: this.abi,
        functionName: 'getValue',
      });

      const owner = await this.client.readContract({
        address: this.contractAddress,
        abi: this.abi,
        functionName: 'owner',
      });

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

  // 🔹 Task 3: Read ValueUpdated events with pagination
  async getValueUpdatedEvents(fromBlock: number, toBlock: number) {
    try {
      // Validate block range (max 2048 blocks per query for RPC limits)
      const blockRange = toBlock - fromBlock;
      if (blockRange > 2048) {
        throw new BadRequestException(
          `Block range too large. Maximum allowed is 2048 blocks, got ${blockRange}`,
        );
      }

      if (fromBlock < 0 || toBlock < 0) {
        throw new BadRequestException('Block numbers must be positive');
      }

      if (fromBlock > toBlock) {
        throw new BadRequestException(
          'fromBlock must be less than or equal to toBlock',
        );
      }

      const events = await this.client.getLogs({
        address: this.contractAddress,
        event: {
          type: 'event',
          name: 'ValueUpdated',
          inputs: [
            {
              name: 'oldValue',
              type: 'uint256',
              indexed: false,
            },
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

      return {
        events: events.map((event) => ({
          blockNumber: event.blockNumber?.toString(),
          oldValue: event.args.oldValue?.toString(),
          newValue: event.args.newValue?.toString(),
          transactionHash: event.transactionHash,
        })),
        totalEvents: events.length,
        fromBlock,
        toBlock,
        contractAddress: this.contractAddress,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
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

  // 🔹 Task 4: Centralized RPC Error Handler
  private handleRpcError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);

    console.error('[BlockchainService] RPC Error:', message);

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
