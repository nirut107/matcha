import { Controller, Get, Req, UseGuards, Post, Body } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { DatabaseService } from '../database/database.service';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UnauthorizedException } from '@nestjs/common';
import { MeResponseDto } from './dto/me-response.dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private db: DatabaseService,
    private UserService: UserService,
  ) {}

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: MeResponseDto,
    description: 'Get current logged-in user',
  })
  async getMe(@Req() req: any) {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedException();
    }

    const userId = req.user.userId;

    const result = await this.db.query(
      `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.google_id,
        CASE WHEN p.user_id IS NOT NULL THEN true ELSE false END AS has_profile,
        COALESCE(p.is_setup, false) AS is_setup
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      hasGoogle: !!user.google_id,
      hasProfile: user.has_profile,
      isSetup: user.is_setup,
    };
  }

  @Post('email')
  @UseGuards(JwtGuard)
  async updateEmail(@Req() req, @Body() email: string) {
    console.log('Email :', email, req);
    return this.updateEmail(req.user.userId, email);
  }

  @Post('online')
  @UseGuards(JwtGuard)
  setOnline(@Req() req: any) {
    return this.UserService.setUserOnline(req.user.userId, true);
  }
  @Post('offline')
  @UseGuards(JwtGuard)
  setOffline(@Req() req: any) {
    return this.UserService.setUserOnline(req.user.userId, false);
  }
}
