import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class MatchService {
  constructor(private db: DatabaseService) {}

  async getMatches(userId: number) {
    const query = `
    WITH current_user AS (
        SELECT 
            p.user_id,
            p.latitude AS u_lat,
            p.longitude AS u_long,
            p.gender,
            p.preference
        FROM profiles p
        WHERE p.user_id = $1
    ),
    tag_match AS (
        SELECT 
            ut2.user_id,
            COUNT(*) AS common_tags
        FROM user_tags ut1
        JOIN user_tags ut2 
            ON ut1.tag_id = ut2.tag_id
        WHERE ut1.user_id = $1
          AND ut2.user_id != $1
        GROUP BY ut2.user_id
    )
    SELECT 
        u.id,
        u.username,
        p.fame_rating,
        (
          6371 * acos(
            cos(radians(cu.u_lat)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(cu.u_long)) +
            sin(radians(cu.u_lat)) *
            sin(radians(p.latitude))
          )
        ) AS distance_km,
        COALESCE(tm.common_tags, 0) AS common_tags,
        (
          (100 - (
            6371 * acos(
              cos(radians(cu.u_lat)) *
              cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(cu.u_long)) +
              sin(radians(cu.u_lat)) *
              sin(radians(p.latitude))
            )
          )) * 2
          + COALESCE(tm.common_tags, 0) * 10
          + p.fame_rating * 0.5
        ) AS score
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    JOIN current_user cu ON TRUE
    LEFT JOIN tag_match tm ON tm.user_id = u.id
    WHERE u.id != $1
    ORDER BY score DESC
    LIMIT 50;
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }
}