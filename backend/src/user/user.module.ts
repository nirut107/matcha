import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { DatabaseModule } from '../database/database.module';
import { UserService } from './user.service';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [UserController],
  providers: [UserService, MailService],
})
export class UserModule {}
