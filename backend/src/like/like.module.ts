import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { DatabaseModule } from '../database/database.module';


@Module({
  imports: [DatabaseModule],
  providers: [LikeService],
  controllers: [LikeController]
})
export class LikeModule {}
