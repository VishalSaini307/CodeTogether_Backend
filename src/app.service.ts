import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🚀 NestJS backend deployed successfully on Vercel!';
  }
}