import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayMaxSize, IsNumber } from 'class-validator';

export class ActionSwipeDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  targetId: number;

  @ApiProperty({ example: 'like' })
  @IsString()
  action: "like" | "pass";
}
