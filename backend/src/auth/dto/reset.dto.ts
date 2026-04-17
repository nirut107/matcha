import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'The email address registered with the account' 
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000', 
    description: 'The unique UUID token sent to the user via email' 
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ 
    example: 'StrongPassword123!', 
    description: 'The new password for the account (minimum 8 characters)' 
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}