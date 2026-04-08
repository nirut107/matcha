import {
    Injectable,
    BadRequestException,
  } from '@nestjs/common';
  import { DatabaseService } from '../database/database.service';

  @Injectable()
  export class BlocksService {
    constructor(private db: DatabaseService) {}

    // 🔥 BLOCK USER
    async blockUser(blockerId: number, blockedId: number) {
      if (blockerId === blockedId) {
        throw new BadRequestException('Cannot block yourself');
      }

      await this.db.query('BEGIN');

      try {
        // 👉 1. insert block
        await this.db.query(
          `
          INSERT INTO blocks (blocker_id, blocked_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          `,
          [blockerId, blockedId],
        );

        await this.db.query('COMMIT');
        console.log(blockerId,"block ", blockedId)
        return { message: 'User blocked' };
      } catch (e) {
        await this.db.query('ROLLBACK');
        throw e;
      }
    }

    async unblockUser(blockerId: number, blockedId: number) {
      await this.db.query(
        `
        DELETE FROM blocks
        WHERE blocker_id = $1 AND blocked_id = $2
        `,
        [blockerId, blockedId],
      );

      return { message: 'User unblocked' };
    }


    async getMyBlocks(userId: number) {
      const result = await this.db.query(
        `
        SELECT
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          p.url as profile_picture
        FROM blocks b
        JOIN users u ON u.id = b.blocked_id
        LEFT JOIN pictures p
          ON p.user_id = u.id AND p.is_profile = TRUE
        WHERE b.blocker_id = $1
        `,
        [userId],
      );

      return result.rows;
    }

    async isBlocked(userA: number, userB: number) {
      const result = await this.db.query(
        `
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
        `,
        [userA, userB],
      );

      return result.rows.length > 0;
    }
  }
