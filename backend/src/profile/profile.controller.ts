import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    Req,
    Body,
  } from '@nestjs/common';
  import { ProfileService } from './profile.service';
  import { JwtGuard } from '../auth/jwt.guard';
  import {
    ApiTags,
    ApiBearerAuth,
    ApiResponse,
  } from '@nestjs/swagger';
  import { CreateProfileDto } from './dto/create-profile.dto';
  
  @ApiTags('Profile')
  @ApiBearerAuth()
  @Controller('profile')
  export class ProfileController {
    constructor(private profileService: ProfileService) {}
  
    @Post()
    @UseGuards(JwtGuard)
    @ApiResponse({ status: 201, description: 'Profile saved' })
    createOrUpdate(@Req() req: any, @Body() dto: CreateProfileDto) {
      return this.profileService.upsertProfile(req.user.userId, dto);
    }
  
    @Get('me')
    @UseGuards(JwtGuard)
    getMe(@Req() req: any) {
      return this.profileService.getMyProfile(req.user.userId);
    }
  
    @Get(':id')
    getUser(@Param('id') id: string) {
      return this.profileService.getProfileById(Number(id));
    }
  
    @Delete()
    @UseGuards(JwtGuard)
    delete(@Req() req: any) {
      return this.profileService.deleteProfile(req.user.userId);
    }
  }