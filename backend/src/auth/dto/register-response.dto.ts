import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'john@mail.com' })
  email: string;
}
