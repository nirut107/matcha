import { ApiProperty } from '@nestjs/swagger';

export class VisitorProfileDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'Sarah' })
  first_name: string;

  @ApiProperty({ example: '2026-04-17T15:00:00Z' })
  created_at: Date;

  @ApiProperty({ example: 24 })
  age: number;

  @ApiProperty({
    example: 'https://matcha-storage.com/profile.jpg',
    nullable: true,
  })
  profile_image: string | null;
}
