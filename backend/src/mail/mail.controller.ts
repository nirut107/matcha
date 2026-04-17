import { Controller } from '@nestjs/common';
import { MailService } from './mail.service';
import { Post, Body } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: '16111ce8-6c0b-456e-8a00-f59d19cdb381' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('verify-email')
  async verifyEmail(@Body() dto:VerifyEmailDto) {
    console.log(dto.token);
    return this.mailService.verifyEmail(dto.token);
  }
}
