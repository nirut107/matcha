import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'john@gmail.com' })
  email: string;

  @ApiProperty({
    example: true,
    description: 'True if user registered with Google',
  })
  hasGoogle: boolean;
  hasProfile: boolean;
  isSetup: boolean;
}
