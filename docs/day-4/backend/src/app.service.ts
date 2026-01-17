import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Day 4 - Backend API dengan NestJS (Avalanche Fuji Testnet)';
  }
}
