import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'secretKey' }),
  ],
  providers: [LikeService, NotificationGateway, NotificationService],
  controllers: [LikeController]
})
export class LikeModule {}
