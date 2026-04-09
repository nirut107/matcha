import { IsNotEmpty, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMapUsersDto {
  @IsNotEmpty()
  @IsLatitude()
  @Type(() => Number) // Automatically converts the query string to a number
  lat: number;

  @IsNotEmpty()
  @IsLongitude()
  @Type(() => Number)
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
