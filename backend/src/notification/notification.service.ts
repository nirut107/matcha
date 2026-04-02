import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly db: DatabaseService,
    private gateway: NotificationGateway
  ) {}

  async create(userId: number, type: string, data: any) {
    const result = await this.db.query(
      `
      INSERT INTO notifications (user_id, type, data)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [userId, type, data],
    );

    const notification = result.rows[0];
    this.gateway.sendToUser(userId, type)

    return notification;
  }
}