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
        o.first_name,
        o.last_name,
        u.is_online,
        u.last_connection,
        p.url as profile_picture,
        m.created_at,
    
        -- 🔥 last message
        lm.content AS last_message,
        lm.created_at AS last_message_time,
    
        -- 🔥 unread count
        COALESCE(unread.count, 0) AS unread_count
    
      FROM matches m
    
      JOIN users u 
        ON u.id = CASE 
          WHEN m.user1_id = $1 THEN m.user2_id
          ELSE m.user1_id
        END
    
      LEFT JOIN pictures p 
        ON p.user_id = u.id AND p.is_profile = TRUE
      
      LEFT JOIN profiles o 
        ON o.user_id = u.id
    
      -- 🔥 last message (LATERAL = per row)
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE match_id = m.id
          AND deleted = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON TRUE
    
      -- 🔥 unread count
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM messages
        WHERE match_id = m.id
          AND sender_id != $1
          AND is_read = FALSE
      ) unread ON TRUE
    
      WHERE m.user1_id = $1 OR m.user2_id = $1
    
      ORDER BY 
        lm.created_at DESC NULLS LAST, -- 🔥 sort by last message
        m.created_at DESC
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
