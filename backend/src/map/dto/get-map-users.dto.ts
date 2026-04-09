import { IsNotEmpty, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class GetMapUsersDto {
  @IsNotEmpty()
  @IsLatitude()
  @ApiProperty({ example: 13.7563, description: 'ละติจูดปัจจุบัน' })
  @Type(() => Number)
  lat: number;

  @IsNotEmpty()
  @IsLongitude()
  @Type(() => Number)
  @ApiProperty({ example: 100.5018, description: 'ลองจิจูดปัจจุบัน' })
  lng: number;
}

export class MapUserImageDto {
  url: string;
  is_profile: boolean;
  position: number;
}

export class MapUserResponseDto {
  userId: number;
  first_name: string;
  age: number;
  biography: string;
  tags: string[];
  images: MapUserImageDto[];
  profileIndex: number;
  profileImage: string | null;
  fame_rating: number;

  latitude: number;
  longitude: number;

  distance: string;
  is_online: boolean;
  i_blocked_them: boolean;
  i_liked_them: boolean;
}
