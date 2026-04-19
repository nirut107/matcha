import { Module } from '@nestjs/common';
import { DatesService } from './dates.service';
import { DatesController } from './dates.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [DatabaseModule, NotificationModule],
  providers: [DatesService],
  controllers: [DatesController],
})
export class DatesModule {}
