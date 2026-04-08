import { Controller } from '@nestjs/common';
import { MapService } from './map.service';
import { Get, Req, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.guard';
import { GetMapUsersDto, MapUserResponseDto } from './dto/get-map-users.dto';

@Controller('map')
export class MapController {
  constructor(private Mapservice: MapService) {}

  @Get('')
  @UseGuards(JwtGuard)
  async getMapUsers(
    @Req() req,
    @Query() query: GetMapUsersDto,
  ): Promise<MapUserResponseDto[]> {
    const userId = req.user.id;
    return this.Mapservice.getMapUsers(userId, query.lat, query.lng);
  }
}
