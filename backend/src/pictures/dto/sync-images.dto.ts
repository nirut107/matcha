import {
    IsArray,
    ValidateNested,
    IsOptional,
    IsNumber,
    IsBoolean,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty } from '@nestjs/swagger';
  
  class ImageItemDto {
    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    id?: number;
  
    @ApiProperty({ example: 1 })
    @IsNumber()
    position: number;
  
    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    is_profile?: boolean; 
  
    file?: Express.Multer.File;
  }
  
  export class SyncImagesDto {
    @ApiProperty({
      type: [ImageItemDto],
      example: [
        { id: 1, position: 1, is_profile: true },
        { id: 2, position: 2 },
        { position: 3 , file: 'file' },
      ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImageItemDto)
    images: ImageItemDto[];
  }