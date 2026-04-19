import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class MessagesService {
  constructor(private db: DatabaseService) {}

  async getMessages(userId: number, matchId: number) {
    const match = await this.db.query(
      `
        SELECT 1
        FROM matches
        WHERE id = $1
          AND (user1_id = $2 OR user2_id = $2)
        `,
      [matchId, userId],
    );

    if (match.rows.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const result = await this.db.query(
      `
        SELECT 
          m.id,
          m.match_id,
          m.sender_id,
          m.content,
          m.created_at,
          m.is_read
        FROM messages m
        WHERE m.match_id = $1
          AND m.deleted = FALSE
        ORDER BY m.created_at ASC
        `,
      [matchId],
    );

    await this.db.query(
      `
        UPDATE messages 
        SET is_read = TRUE 
        WHERE match_id = $1 
          AND sender_id != $2 
          AND is_read = FALSE
        `,
      [matchId, userId],
    );

    return { result: result.rows, userId };
  }

  async markAsRead(userId: number, matchId: number) {
    const match = await this.db.query(
      `
        SELECT 1
        FROM matches
        WHERE id = $1
          AND (user1_id = $2 OR user2_id = $2)
        `,
      [matchId, userId],
    );

    if (match.rows.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const result = await this.db.query(
      `
        UPDATE messages
        SET is_read = TRUE
        WHERE match_id = $1
          AND sender_id != $2
          AND is_read = FALSE
        RETURNING id
        `,
      [matchId, userId],
    );

    return {
      success: true,
      updatedCount: result.rowCount,
      updatedIds: result.rows.map((r) => r.id),
    };
  }
}
