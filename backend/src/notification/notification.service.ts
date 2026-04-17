import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly db: DatabaseService,
    private gateway: NotificationGateway,
  ) {}

  async create(userId: number, type: string, data: any) {
    const result = await this.db.query(
      `
      INSERT INTO notifications (user_id, type, data, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, type, (data->>'senderId')) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        created_at = NOW(),
        is_read = false
      RETURNING *
      `,
      [userId, type, data],
    );

    const notification = result.rows[0];
    console.log('create noti', type, 'data', data);
    this.gateway.sendToUser(userId, { type, data });

    return notification;
  }

  // notification.service.ts
  async getUnreadCounts(userId: number) {
    const notiCount = await this.db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId],
    );

    // Assuming you have a messages table with an is_read flag
    const msgCount = await this.db.query(
      `SELECT COUNT(*) 
       FROM messages msg
       JOIN matches m ON msg.match_id = m.id
       WHERE msg.is_read = false 
         AND msg.sender_id != $1
         AND (m.user1_id = $1 OR m.user2_id = $1)`,
      [userId],
    );

    return {
      notificationsCount: parseInt(notiCount.rows[0].count),
      messagesCount: parseInt(msgCount.rows[0].count),
    };
  }
}
