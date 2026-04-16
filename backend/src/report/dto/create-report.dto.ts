import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  reported_id: number;

  @ApiProperty({ example: 'Fake profile / spam' })
  @IsNotEmpty()
  reason: string;
}