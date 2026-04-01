import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MatchesService {
  constructor(private db: DatabaseService) {}

  // 🔥 get my matches
  async getMyMatches(userId: number) {
    const result = await this.db.query(
      `
      SELECT 
        m.id,
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.is_online,
        u.last_connection,
        p.url as profile_picture,
        m.created_at
      FROM matches m
      JOIN users u 
        ON u.id = CASE 
          WHEN m.user1_id = $1 THEN m.user2_id
          ELSE m.user1_id
        END
      LEFT JOIN pictures p 
        ON p.user_id = u.id AND p.is_profile = TRUE
      WHERE m.user1_id = $1 OR m.user2_id = $1
      ORDER BY m.created_at DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async isMatched(userA: number, userB: number) {
    const result = await this.db.query(
      `
      SELECT 1 FROM matches
      WHERE user1_id = LEAST($1, $2)
        AND user2_id = GREATEST($1, $2)
      `,
      [userA, userB],
    );

    return { matched: result.rows.length > 0 };
  }

  async removeMatch(userA: number, userB: number) {
    await this.db.query('BEGIN');
  
    try {
      await this.db.query(
        `
        DELETE FROM matches
        WHERE user1_id = LEAST($1, $2)
          AND user2_id = GREATEST($1, $2)
        `,
        [userA, userB],
      );
  
      await this.db.query(
        `
        DELETE FROM likes
        WHERE (liker_id = $1 AND liked_id = $2)
           OR (liker_id = $2 AND liked_id = $1)
        `,
        [userA, userB],
      );
  
      await this.db.query('COMMIT');
  
      return { message: 'Match and likes removed' };
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }
}