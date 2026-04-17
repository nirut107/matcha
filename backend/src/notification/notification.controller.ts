import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { DatabaseService } from '../database/database.service';
import { ApiProperty, ApiOkResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

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
  constructor(
    private readonly db: DatabaseService,
    private NotificationService: NotificationService,
  ) {}

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
          SELECT id, 
            data, 
            user_id, 
            created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' AS created_at
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
  @Get('unreadcount')
  @UseGuards(JwtGuard)
  async getUnreadCount(@Req() req: any) {
    console.log('================');
    const userId = req.user.userId;
    return this.NotificationService.getUnreadCounts(userId);
  }
}
