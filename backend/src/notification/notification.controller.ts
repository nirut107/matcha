import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { DatabaseService } from '../database/database.service';
import { ApiProperty, ApiOkResponse } from '@nestjs/swagger';

export class NotificationDataDto {
  @ApiProperty({ example: 42 })
  from_user_id: number;
}

export class NotificationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  user_id: number;

  @ApiProperty({
    example: 'like',
    enum: ['like', 'message', 'visit', 'match'],
  })
  type: string;

  @ApiProperty({ type: NotificationDataDto })
  data: NotificationDataDto;

  @ApiProperty({ example: false })
  is_read: boolean;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  created_at: Date;
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly db: DatabaseService) {}

  @UseGuards(JwtGuard)
  @Get()
  @ApiOkResponse({
    description: 'List of notification',
    type: NotificationDto,
    isArray: true,
  })
  async getNotifications(@Req() req: any) {
    const userId = req.user.userId;

    await this.db.query('BEGIN');

    try {
      await this.db.query(
        `
          UPDATE notifications
          SET is_read = TRUE
          WHERE user_id = $1 AND is_read = FALSE
          `,
        [userId],
      );

      const result = await this.db.query(
        `
          SELECT *
          FROM notifications
          WHERE user_id = $1
          ORDER BY created_at DESC
          `,
        [userId],
      );

      await this.db.query('COMMIT');

      return result.rows;
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }

  @UseGuards(JwtGuard)
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.userId;

    const result = await this.db.query(
      `
    SELECT COUNT(*) AS count
    FROM notifications
    WHERE user_id = $1 AND is_read = FALSE
    `,
      [userId],
    );

    return {
      count: Number(result.rows[0].count),
    };
  }
}
