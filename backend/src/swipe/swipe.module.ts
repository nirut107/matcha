import { Module } from '@nestjs/common';
import { SwipeService } from './swipe.service';
import { SwipeController } from './swipe.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports:[DatabaseModule, NotificationModule],
  providers: [SwipeService],
  controllers: [SwipeController]
})
export class SwipeModule {}
