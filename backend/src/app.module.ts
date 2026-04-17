import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ProfileModule } from './profile/profile.module';
import { TagModule } from './tag/tag.module';
import { PicturesModule } from './pictures/pictures.module';
import { MatchesModule } from './matches/matches.module';
import { BlocksModule } from './blocks/blocks.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { SwipeModule } from './swipe/swipe.module';
import { MessagesModule } from './messages/messages.module';
import { MapModule } from './map/map.module';
import { DatesModule } from './dates/dates.module';
import { ReportModule } from './report/report.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UserModule,
    ProfileModule,
    TagModule,
    PicturesModule,
    MatchesModule,
    BlocksModule,
    NotificationModule,
    ChatModule,
    SwipeModule,
    MessagesModule,
    MapModule,
    DatesModule,
    ReportModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}