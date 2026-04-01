import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { DatabaseService } from '../database/database.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private db: DatabaseService) {}

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
}
