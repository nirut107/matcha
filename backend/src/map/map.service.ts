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
            p.latitude,   -- 🔥 Added for Mapbox markers
            p.longitude,  -- 🔥 Added for Mapbox markers
      
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
          AND p.latitude IS NOT NULL   -- Ensure they have location data
          AND p.longitude IS NOT NULL
      
          -- ❌ blocked (Do not show if blocked)
          AND u.id NOT IN (
            SELECT blocked_id FROM blocks WHERE blocker_id = $1
            UNION
            SELECT blocker_id FROM blocks WHERE blocked_id = $1
          )
      
          -- ✅ Swiped filter REMOVED (Show everyone)
          -- ✅ Gender/Preference filter REMOVED (Show everyone)
      
          GROUP BY u.id, p.user_id
      
          ORDER BY distance ASC
          LIMIT 100 -- Limit to 100 so the map doesn't lag with too many markers
          `,
      [userId, centerLat, centerLng],
    );

    return result.rows.map((row) => {
      const images = row.images || [];

      const profileIndex = images.findIndex((img) => img.is_profile);
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
        latitude: parseFloat(row.latitude), // Converted to number for Mapbox
        longitude: parseFloat(row.longitude), // Converted to number for Mapbox
        distance: `${Number(row.distance).toFixed(1)} km`,
        is_online: row.is_online,
      };
    });
  }
}
