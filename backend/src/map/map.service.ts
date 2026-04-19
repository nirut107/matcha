import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MapService {
  constructor(private db: DatabaseService) {}

  async getMapUsers(userId: number, centerLat?: number, centerLng?: number) {
    const meRes = await this.db.query(
      `SELECT latitude, longitude FROM profiles WHERE user_id = $1`,
      [userId],
    );
    const me = meRes.rows[0];

    const searchLat = centerLat ?? me?.latitude;
    const searchLng = centerLng ?? me?.longitude;

    if (searchLat == null || searchLng == null) {
      throw new ForbiddenException(
        'Please set your location in your profile or allow GPS to view the map.',
      );
    }

    // 4. The Distance Calculation Variables
    const myLat = me?.latitude ?? searchLat;
    const myLng = me?.longitude ?? searchLng;

    // 5. Run the query (using searchLat/searchLng for $2/$3)
    const result = await this.db.query(
      `
      SELECT
        u.id,
        p.first_name,
        u.is_online,
        p.gender,
        p.age,
        p.biography,
        p.fame_rating,
        p.latitude,   
        p.longitude,  
  
        -- 📍 Distance from Map Center (Used for ORDER BY)
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($2::float)) *
              cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians($3::float)) +
              sin(radians($2::float)) *
              sin(radians(p.latitude))
            ))
          )
        ) AS distance_from_center,

        -- 📍 Distance from ME (Used for the UI display)
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($4::float)) *
              cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians($5::float)) +
              sin(radians($4::float)) *
              sin(radians(p.latitude))
            ))
          )
        ) AS distance_from_me,

        EXISTS (
          SELECT 1
          FROM blocks b2
          WHERE b2.blocker_id = $1 AND b2.blocked_id = u.id
        ) AS i_blocked_them,

        EXISTS (
          SELECT 1
          FROM swipes s2
          WHERE s2.swiper_id = $1 
            AND s2.target_id = u.id 
            AND s2.action = 'like'
        ) AS i_liked_them,
  
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
  
      AND NOT EXISTS (
          SELECT 1 FROM blocks b 
          WHERE b.blocked_id = $1 AND b.blocker_id = u.id
      )
  
      GROUP BY u.id, p.user_id
  
      ORDER BY distance_from_center ASC
      LIMIT 100 
      `,
      [userId, searchLat, searchLng, myLat, myLng], // 👈 Updated parameters
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
        gender: row.gender,
        biography: row.biography,
        tags: row.tags || [],
        images,
        profileIndex,
        profileImage,
        fame_rating: row.fame_rating,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        distance: `${Number(row.distance_from_me).toFixed(1)} km`,
        is_online: row.is_online,
        i_blocked_them: row.i_blocked_them,
        i_liked_them: row.i_liked_them,
      };
    });
  }
}
