import { ApiProperty } from '@nestjs/swagger';

export class GetEventsDto {
  @ApiProperty({
    description: 'The starting block number to fetch events from',
    example: 0,
  })
  fromBlock: number;

  @ApiProperty({
    description: 'The ending block number to fetch events to',
    example: 100000,
  })
  toBlock: number;
}
