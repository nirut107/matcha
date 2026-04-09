import { Module } from '@nestjs/common';
import { DatesService } from './dates.service';
import { DatesController } from './dates.controller';

@Module({
  providers: [DatesService],
  controllers: [DatesController]
})
export class DatesModule {}
