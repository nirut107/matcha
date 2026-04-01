import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';


@Injectable()
export class LikeService {
    constructor(private db:DatabaseService) {}

    async likeUser(likerId: number, likedId: number) {
        await this.db.query(
          `INSERT INTO likes (liker_id, liked_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [likerId, likedId]
        );
      
        const res = await this.db.query(
          `SELECT 1 FROM likes WHERE liker_id = $2 AND liked_id = $1`,
          [likerId, likedId]
        );
      
        if (res.rows.length) {
          await this.db.query(
            `INSERT INTO matches (user1_id, user2_id)
             VALUES (LEAST($1,$2), GREATEST($1,$2))
             ON CONFLICT DO NOTHING`,
            [likerId, likedId]
          );
        }
      
        return { success: true };
      }
}
