import { ApiProperty } from '@nestjs/swagger';
import e from 'express';

export class MeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'john@gmail.com' })
  email: string;

  @ApiProperty({
    example: true,
    description: 'True if user registered with Google',
  })
  hasGoogle: boolean;
  hasProfile: boolean;
  isSetup: boolean;
}

export class UpdateEmailDto {
  @ApiProperty({ example: 'abc@getMaxListeners.com' })
  email: string;
}
