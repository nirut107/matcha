import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { DatabaseService } from '../database/database.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly db: DatabaseService) {}

  @UseGuards(JwtGuard)
  @Get()
  async getNotifications(@Req() req: any) {
    return this.db.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.userId],
    );
  }
}