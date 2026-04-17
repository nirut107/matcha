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
}
