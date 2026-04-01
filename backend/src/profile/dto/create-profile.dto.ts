import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayMaxSize } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ example: 'male' })
  @IsString()
  gender: string;

  @ApiProperty({ example: 'female' })
  @IsString()
  preference: string;

  @ApiProperty({ example: 'I love coding' })
  @IsString()
  biography: string;

  @ApiProperty({ type: [String], example: ['#coding', '#coffee'] })
  @IsArray()
  @ArrayMaxSize(20)
  tags: string[];
}