// dates.dto.ts
import { IsInt, IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class RequestDateDto {
  @IsInt()
  receiverId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  details?: string;
}

export class RespondDateDto {
  @IsInt()
  dateId: number;

  @IsIn(['accept', 'reject'])
  action: 'accept' | 'reject';
}

export class CancelDateDto {
  @IsInt()
  dateId: number;
}