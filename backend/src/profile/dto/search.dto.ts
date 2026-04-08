import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsArray,
  IsString,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchDto {
  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAge?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAge?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minFame?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxFame?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDistance?: number;

  // 🔥 FIX 1: Transform URL query strings into real arrays
  @ApiPropertyOptional({
    example: ['#coding', '#coffee'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((item) => item.trim());
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // 🔥 FIX 2: Restrict sortBy to EXACTLY what your SQL sortMap allows
  @ApiPropertyOptional({ example: 'distance' })
  @IsOptional()
  @IsString()
  @IsIn(['age', 'distance', 'fame', 'tags']) // Prevents random strings being passed
  sortBy?: string;

  // 🔥 FIX 3: Restrict sortDir
  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}