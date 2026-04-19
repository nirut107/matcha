import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
// import { NotificationGateway } from './notification.gateway';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { AppGateway } from 'src/chat/app.gateway';
import {ChatModule} from 'src/chat/chat.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'secretKey' }),
    ChatModule,
    SocketModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService, AppGateway],
  exports: [NotificationService],
})
export class NotificationModule {}