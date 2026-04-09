import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MapService {
  constructor(private db: DatabaseService) {}

  async getMapUsers(userId: number, centerLat: number, centerLng: number) {
    const result = await this.db.query(
      `
          SELECT
            u.id,
            p.first_name,
            u.is_online,
            p.age,
            p.biography,
            p.fame_rating,
            p.latitude,   
            p.longitude,  
      
            -- 🔥 distance (km) calculated from the center of the Mapbox view
            (
              6371 * acos(
                cos(radians($2)) *
                cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians($3)) +
                sin(radians($2)) *
                sin(radians(p.latitude))
              )
            ) AS distance,

            -- 🔥 i_blocked_them
            EXISTS (
              SELECT 1
              FROM blocks b2
              WHERE b2.blocker_id = $1 AND b2.blocked_id = u.id
            ) AS i_blocked_them,

            -- 🔥 i_liked_them
            -- Note: Adjust 'likes', 'liker_id', and 'liked_id' if your table/columns are named differently
            EXISTS (
              SELECT 1
              FROM likes l2
              WHERE l2.liker_id = $1 AND l2.liked_id = u.id
            ) AS i_liked_them,
      
            -- 🔥 images
            COALESCE(
              JSON_AGG(
                JSONB_BUILD_OBJECT(
                  'url', pic.url,
                  'is_profile', pic.is_profile,
                  'position', pic.position
                )
                ORDER BY pic.position
              ) FILTER (WHERE pic.url IS NOT NULL),
              '[]'
            ) AS images,
      
            -- 🔥 tags
            (
              SELECT COALESCE(
                ARRAY_AGG(t2.name),
                '{}'
              )
              FROM user_tags ut2
              JOIN tags t2 ON t2.id = ut2.tag_id
              WHERE ut2.user_id = u.id
            ) AS tags
      
          FROM users u
          JOIN profiles p ON p.user_id = u.id
          LEFT JOIN pictures pic ON pic.user_id = u.id
      
          WHERE u.id != $1
          AND p.latitude IS NOT NULL   
          AND p.longitude IS NOT NULL
      
          -- ⚠️ NOTE: If you want 'i_blocked_them' to ever be true, 
          -- you must REMOVE or COMMENT OUT this block filter below:
          AND u.id NOT IN (
            SELECT blocked_id FROM blocks WHERE blocker_id = $1
            UNION
            SELECT blocker_id FROM blocks WHERE blocked_id = $1
          )
      
          GROUP BY u.id, p.user_id
      
          ORDER BY distance ASC
          LIMIT 100 
          `,
      [userId, centerLat, centerLng],
    );

    return result.rows.map((row) => {
      const images = row.images || [];

      const profileIndex = images.findIndex((img: any) => img.is_profile);
      const profileImage =
        profileIndex !== -1 ? images[profileIndex].url : null;

      return {
        userId: row.id,
        first_name: row.first_name,
        age: row.age,
        biography: row.biography,
        tags: row.tags || [],
        images,
        profileIndex,
        profileImage,
        fame_rating: row.fame_rating,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        distance: `${Number(row.distance).toFixed(1)} km`,
        is_online: row.is_online,
        i_blocked_them: row.i_blocked_them,
        i_liked_them: row.i_liked_them,
      };
    });
  }
}
