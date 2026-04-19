import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { SocketRegistry } from '../socket/socket.registry';
import { ChatController } from './chat.controller';
import { SocketModule } from 'src/socket/socket.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [JwtModule, SocketModule, DatabaseModule],
  providers: [AppGateway, SocketRegistry, DatabaseService],
  controllers: [ChatController],
  // exports: [SocketRegistry],
})
export class ChatModule {}
