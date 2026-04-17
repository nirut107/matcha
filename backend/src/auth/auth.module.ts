import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module'; // 👈 สำคัญ
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';


@Module({
  imports: [DatabaseModule, MailModule, PassportModule,JwtModule.register({
    secret: process.env.JWT_ACCESS_SECRET,
    signOptions: { expiresIn: '3d' },
  })],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, MailService],
  exports: [PassportModule]
})
export class AuthModule {}