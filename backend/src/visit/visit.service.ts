import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class VisitService {
  constructor(private db: DatabaseService) {}

  async getProfileVisits(userId: number) {
    // 🔥 STEP 1: Get my location
    const meRes = await this.db.query(
      `SELECT latitude, longitude FROM profiles WHERE user_id = $1`,
      [userId],
    );

    const me = meRes.rows[0];

    if (!me) {
      throw new ForbiddenException('Complete your profile first');
    }

    // 🔥 STEP 2: Main query
    const result = await this.db.query(
      `
      SELECT 
        v.visitor_id AS "userId",
        v.created_at,
  
        p.first_name,
        p.age,
        p.biography,
        p.fame_rating,
  
        u.is_online,
        u.last_connection,
  
        -- 📍 distance
        (
          6371 * acos(
            cos(radians($2)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($3)) +
            sin(radians($2)) *
            sin(radians(p.latitude))
          )
        ) AS distance,
  
        -- 📸 images (FULL like suggestions)
        (
          SELECT COALESCE(
            JSON_AGG(
              JSONB_BUILD_OBJECT(
                'url', pic.url,
                'is_profile', pic.is_profile,
                'position', pic.position
              ) ORDER BY pic.position
            ), '[]'
          )
          FROM pictures pic
          WHERE pic.user_id = v.visitor_id
        ) AS images,
  
        -- 🏷️ tags
        (
          SELECT COALESCE(
            ARRAY_AGG(t.name),
            '{}'
          )
          FROM user_tags ut
          JOIN tags t ON t.id = ut.tag_id
          WHERE ut.user_id = v.visitor_id
        ) AS tags
  
      FROM visits v
      JOIN profiles p ON v.visitor_id = p.user_id
      JOIN users u ON u.id = v.visitor_id
  
      WHERE v.visited_id = $1
  
      ORDER BY v.created_at DESC
      `,
      [userId, me.latitude, me.longitude],
    );

    // 🔥 STEP 3: Match EXACT output format
    return result.rows.map((row) => {
      const images = row.images || [];

      const profileIndex = images.findIndex((img) => img.is_profile);
      const profileImage = profileIndex !== -1 ? images[profileIndex].url : '';

      return {
        first_name: row.first_name,
        age: row.age,
        biography: row.biography ?? '',
        tags: row.tags || [],
        images,
        fame_rating: row.fame_rating ?? 0,
        distance: `${Number(row.distance).toFixed(1)} km`,
        is_online: row.is_online,
        userId: row.userId,
        profileIndex,
        profileImage,
        create_at: row.created_at,
        last_connection: row.last_connection,
      };
    });
  }
}
