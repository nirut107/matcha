import { ApiProperty } from '@nestjs/swagger';

export class MatchResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 10 })
  user_id: number;

  @ApiProperty({ example: 'anna' })
  username: string;

  @ApiProperty({ example: 'Anna' })
  first_name: string;

  @ApiProperty({ example: 'Smith' })
  last_name: string;

  @ApiProperty({ example: true })
  is_online: boolean;

  @ApiProperty({
    example: '2026-04-04T12:00:00.000Z',
    nullable: true,
  })
  last_connection: Date;

  @ApiProperty({
    example: '/uploads/profile.jpg',
    nullable: true,
  })
  profile_picture: string;

  @ApiProperty({
    example: 'Hey! How are you?',
    nullable: true,
  })
  last_message: string;

  @ApiProperty({
    example: '2026-04-04T12:05:00.000Z',
    nullable: true,
  })
  last_message_time: Date;

  @ApiProperty({ example: 3 })
  unread_count: number;

  @ApiProperty({
    example: '2026-04-04T11:00:00.000Z',
  })
  created_at: Date;
}