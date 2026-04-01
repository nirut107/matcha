import { ApiProperty } from '@nestjs/swagger';
import { IsString, Min, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'Nirut',
    description: 'Username of the user',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}