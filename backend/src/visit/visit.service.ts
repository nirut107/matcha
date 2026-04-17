import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class VisitService {
  constructor(private db: DatabaseService) {}

  async getProfileVisits(userId: number) {
    const result = await this.db.query(
      `SELECT 
              v.visitor_id as "id",
              v.created_at,
              p.first_name,
              p.last_name,
              p.age,
              (SELECT url FROM pictures WHERE user_id = v.visitor_id AND is_profile = true LIMIT 1) as "profile_image"
           FROM visits v
           JOIN profiles p ON v.visitor_id = p.user_id
           WHERE v.visited_id = $1
           ORDER BY v.created_at DESC`,
      [userId],
    );

    return result.rows;
  }
}
