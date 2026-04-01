import { Controller, Get, Req, UseGuards, Post } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { DatabaseService } from '../database/database.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private db: DatabaseService, private UserService: UserService) {}


  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user.userId;

    const result = await this.db.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId],
    );

    return result.rows[0];
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
