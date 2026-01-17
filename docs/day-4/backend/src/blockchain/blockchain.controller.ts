import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { GetEventsDto } from './dto/get-events.dto';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) { }

  // GET /blockchain/value
  @Get('value')
  @ApiOperation({
    summary: 'Get current stored value from SimpleStorage contract',
    description:
      'Reads the current value stored in the SimpleStorage smart contract on Avalanche Fuji Testnet',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the stored value',
  })
  @ApiResponse({
    status: 503,
    description: 'Blockchain RPC not available',
  })
  async getValue() {
    return this.blockchainService.getLatestValue();
  }

  // POST /blockchain/events
  @Post('events')
  @ApiOperation({
    summary: 'Get ValueUpdated events from SimpleStorage contract',
    description:
      'Fetches ValueUpdated events within a specified block range. Maximum block range is 2048 blocks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved events',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid block range',
  })
  @ApiResponse({
    status: 503,
    description: 'Blockchain RPC not available',
  })
  async getEvents(@Body() body: GetEventsDto) {
    return this.blockchainService.getValueUpdatedEvents(
      body.fromBlock,
      body.toBlock,
    );
  }

  // GET /blockchain/block
  @Get('block')
  @ApiOperation({
    summary: 'Get current block number',
    description:
      'Returns the current block number on Avalanche Fuji Testnet. Useful for pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved block number',
  })
  async getBlockNumber() {
    return this.blockchainService.getCurrentBlockNumber();
  }
}
