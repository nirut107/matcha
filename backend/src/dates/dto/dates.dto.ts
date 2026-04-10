import { IsInt, IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestDateDto {
  @ApiProperty({ 
    example: 15, 
    description: 'ไอดีของผู้รับที่เราต้องการขอเดต' 
  })
  @IsInt()
  receiverId: number;

  @ApiProperty({ 
    example: '2026-04-12T19:00:00Z', 
    description: 'วันเวลาเริ่มต้น (ISO 8601 format)' 
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({ 
    example: '2026-04-12T21:30:00Z', 
    description: 'วันเวลาสิ้นสุด (ISO 8601 format)' 
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({ 
    example: 'เจอกันที่ร้านอาหารริมแม่น้ำเจ้าพระยา ใส่ชุดสีสุภาพนะครับ', 
    description: 'รายละเอียดเพิ่มเติมเกี่ยวกับการนัดหมาย',
    required: false 
  })
  @IsOptional()
  @IsString()
  details?: string;
}

export class RespondDateDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ไอดีของการนัดหมายที่ต้องการตอบรับ/ปฏิเสธ' 
  })
  @IsInt()
  dateId: number;

  @ApiProperty({ 
    example: 'accept', 
    enum: ['accept', 'reject'],
    description: 'สถานะที่ต้องการเลือก' 
  })
  @IsIn(['accept', 'reject'])
  action: 'accept' | 'reject';
}

export class CancelDateDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ไอดีของการนัดหมายที่ต้องการยกเลิก' 
  })
  @IsInt()
  dateId: number;
}