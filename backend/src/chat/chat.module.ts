import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [JwtModule],
  providers: [ChatGateway, DatabaseService],
})
export class ChatModule {}