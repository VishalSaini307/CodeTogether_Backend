import { Module } from '@nestjs/common';
import { CollabGateway } from './collab.gateway';
import { CodeExecService } from './code-exec.service';
// import { CodeExecController } from './code-exec.controller';
import { CodeExecResolver } from './code-exec.resolver';

@Module({
  providers: [CollabGateway, CodeExecService, CodeExecResolver],
  // controllers: [CodeExecController],
})
export class CollabModule {}
