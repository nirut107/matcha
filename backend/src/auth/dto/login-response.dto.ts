import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Nirut' })
  username: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'jwt_token_here' })
  access_token: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}