import { Module } from '@nestjs/common';
import { SocketRegistry } from './socket.registry';

@Module({
  providers: [SocketRegistry],
  exports: [SocketRegistry],
})
export class SocketModule {}