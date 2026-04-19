import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { ForbiddenException } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { min } from 'rxjs';

@Injectable()
export class ProfileService {
  constructor(
    private db: DatabaseService,
    private notificationService: NotificationService,
  ) {}

  async upsertProfile(userId: number, dto: any) {
    console.log(
      'ProfileService.upsertProfile called with userId:',
      userId,
      'dto:',
      dto,
    );
    const {
      gender,
      preference,
      biography,
      first_name,
      last_name,
      tags,
      age,
      latitude,
      longitude,
    } = dto;

    await this.db.query('BEGIN');
    try {
      await this.db.query(
        `
        INSERT INTO profiles (
          user_id, gender, preference, biography,first_name, last_name, age, latitude, longitude, is_setup
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, $9 ,TRUE)
        ON CONFLICT (user_id)
        DO UPDATE SET
          gender = EXCLUDED.gender,
          preference = EXCLUDED.preference,
          biography = EXCLUDED.biography,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          age = EXCLUDED.age,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          is_setup = TRUE
        `,
        [
          userId,
          gender,
          preference,
          biography,
          first_name,
          last_name,
          age,
          latitude,
          longitude,
        ],
      );

      await this.db.query(`DELETE FROM user_tags WHERE user_id = $1`, [userId]);

      for (const tag of tags) {
        const tagRes = await this.db.query(
          `INSERT INTO tags (name)
           VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tag],
        );

        const tagId = tagRes.rows[0].id;

        await this.db.query(
          `INSERT INTO user_tags (user_id, tag_id)
           VALUES ($1, $2)`,
          [userId, tagId],
        );
      }

      await this.db.query('COMMIT');
      return { message: 'Profile saved' };
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }

  async getMyProfile(userId: number) {
    const result = await this.db.query(
      `
      SELECT
        p.*,
        u.username,
    
        COALESCE(
          json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          '[]'
        ) AS tags,
    
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'url', pic.url,
                'is_profile', pic.is_profile,
                'position', pic.position
              )
              ORDER BY pic.position
            )
            FROM pictures pic 
            WHERE pic.user_id = u.id
          ),
          '[]'
        ) AS images
    
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN user_tags ut ON ut.user_id = u.id
      LEFT JOIN tags t ON t.id = ut.tag_id
    
      WHERE p.user_id = $1
    
      GROUP BY p.user_id, u.id, u.username
      `,
      [userId],
    );

    if (result.rows.length === 0)
      throw new NotFoundException('Profile not found');
    return result.rows[0];
  }

  async getProfileById(targetId: number, viewerId: number) {
    // 1. Get viewer's coordinates
    const meRes = await this.db.query(
      `SELECT latitude, longitude FROM profiles WHERE user_id = $1`,
      [viewerId],
    );
    const me = meRes.rows[0];

    // 2. Fetch the profile with properly mapped parameters
    const result = await this.db.query(
      `
      SELECT
        u.id,
        p.first_name,
        u.is_online,
        u.last_connection,
        p.gender,
        p.age,
        p.biography,
        p.fame_rating,
        p.latitude,
        p.longitude,
  
        -- 📍 Distance (Using $3 for Lat and $4 for Lng)
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($3::float)) *
              cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians($4::float)) +
              sin(radians($3::float)) *
              sin(radians(p.latitude))
            ))
          )
        ) AS distance,
  
        -- 🚫 You blocked them (Using $2 for viewerId)
        EXISTS (
          SELECT 1 FROM blocks WHERE blocker_id = $2 AND blocked_id = u.id
        ) AS i_blocked_them,
  
        -- 🛑 They blocked you 
        EXISTS (
          SELECT 1 FROM blocks WHERE blocker_id = u.id AND blocked_id = $2
        ) AS they_blocked_me,
  
        -- ❤️ You liked them
        EXISTS (
          SELECT 1 FROM swipes 
          WHERE swiper_id = $2 AND target_id = u.id AND action = 'like'
        ) AS i_liked_them,
  
        -- 💘 They liked you 
        EXISTS (
          SELECT 1 FROM swipes 
          WHERE swiper_id = u.id AND target_id = $2 AND action = 'like'
        ) AS they_liked_me,
  
        -- 🔥 Match status
        EXISTS (
          SELECT 1 FROM matches 
          WHERE (user1_id = $1 AND user2_id = $2) 
             OR (user1_id = $2 AND user2_id = $1)
        ) AS is_match,
  
        -- 🖼️ Images
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
  
        -- 🏷️ Tags
        (
          SELECT COALESCE(ARRAY_AGG(t2.name), '{}')
          FROM user_tags ut2
          JOIN tags t2 ON t2.id = ut2.tag_id
          WHERE ut2.user_id = u.id
        ) AS tags
  
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN pictures pic ON pic.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, p.user_id
      `,
      [
        targetId, // $1
        viewerId, // $2 (Used for likes/blocks/matches)
        me?.latitude || 0, // $3 (Used for distance math)
        me?.longitude || 0, // $4 (Used for distance math)
      ],
    );

    const row = result.rows[0];
    if (!row) return null;

    const images = row.images || [];
    const profileIndex = images.findIndex((img: any) => img.is_profile);
    const profileImage = profileIndex !== -1 ? images[profileIndex].url : null;

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
      distance: row.distance
        ? `${Number(row.distance).toFixed(1)} km`
        : '0.0 km',
      is_online: row.is_online,
      last_connection: row.last_connection,
      i_blocked_them: row.i_blocked_them,
      they_blocked_me: row.they_blocked_me,
      i_liked_them: row.i_liked_them,
      they_liked_me: row.they_liked_me,
      is_match: row.is_match,
    };
  }

  async deleteProfile(userId: number) {
    await this.db.query(`DELETE FROM profiles WHERE user_id = $1`, [userId]);
    await this.db.query(`DELETE FROM user_tags WHERE user_id = $1`, [userId]);

    return { message: 'Profile deleted' };
  }

  async visitProfile(visitorId: number, visitedId: number) {
    if (visitorId === visitedId) return;

    const recentVisit = await this.db.query(
      `SELECT created_at FROM visits 
       WHERE visitor_id = $1 AND visited_id = $2 
       AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [visitorId, visitedId],
    );

    if (recentVisit.rows.length > 0) return;

    await this.db.query(
      `INSERT INTO visits (visitor_id, visited_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (visitor_id, visited_id) 
       DO UPDATE SET created_at = EXCLUDED.created_at`,
      [visitorId, visitedId],
    );

    const visitorProfileRes = await this.db.query(
      `SELECT p.first_name, 
              (SELECT url FROM pictures WHERE user_id = p.user_id AND is_profile = true LIMIT 1) as profile_image
       FROM profiles p WHERE p.user_id = $1`,
      [visitorId],
    );
    const visitor = visitorProfileRes.rows[0];

    if (visitor) {
      await this.notificationService.create(visitedId, 'visit', {
        senderId: visitorId,
        senderName: visitor.first_name,
        senderImage: visitor.profile_image,
        type: 'VISIT',
        text: `${visitor.first_name} viewed your profile! 👀`,
      });
    }
  }

  async getSuggestions(userId: number) {
    const meRes = await this.db.query(
      `
      SELECT u.id, p.gender, p.preference, p.latitude, p.longitude
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [userId],
    );

    const me = meRes.rows[0];

    if (!me) {
      throw new ForbiddenException('Complete your profile first');
    }

    const result = await this.db.query(
      `
      SELECT
        u.id,
        p.first_name,
        u.is_online,
        u.last_connection,
        p.gender,
        p.age,
        p.biography,
        p.fame_rating,
  
        -- 🔥 distance (km)
        (
          6371 * acos(
            cos(radians($2)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($3)) +
            sin(radians($2)) *
            sin(radians(p.latitude))
          )
        ) AS distance,
  
        -- 🔥 images (WITH PROFILE INFO)
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
      LEFT JOIN user_tags ut ON ut.user_id = u.id
      LEFT JOIN tags t ON t.id = ut.tag_id
  
      WHERE u.id != $1
  
      -- ❌ blocked
      AND u.id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM blocks WHERE blocked_id = $1
      )
  
      -- ❌ swiped
      AND u.id NOT IN (
        SELECT target_id FROM swipes WHERE swiper_id = $1
      )
  
      -- ✅ gender match
      AND (p.gender = $4 OR $4 = 'both')
  
      AND (p.preference = $5 OR p.preference = 'both')
  
      GROUP BY u.id, p.user_id
  
      ORDER BY distance ASC, p.fame_rating DESC
      LIMIT 20
      `,
      [userId, me.latitude, me.longitude, me.preference, me.gender],
    );

    return result.rows.map((row) => {
      const images = row.images || [];

      const profileIndex = images.findIndex((img) => img.is_profile);
      const profileImage =
        profileIndex !== -1 ? images[profileIndex].url : null;

      return {
        userId: row.id,
        first_name: row.first_name,
        gender: row.gender,
        age: row.age,
        biography: row.biography,
        tags: row.tags || [],
        images,
        profileIndex,
        profileImage,
        fame_rating: row.fame_rating,
        distance: `${Number(row.distance).toFixed(1)} km`,
        is_online: row.is_online,
        last_connection: row.last_connection,
      };
    });
  }

  async getSetupStatus(userId: number) {
    const res = await this.db.query(
      `SELECT is_setup FROM profiles WHERE user_id = $1`,
      [userId],
    );

    return res.rows[0];
  }

  async searchProfiles(userId: number, query: SearchDto) {
    const me = await this.getMyProfile(userId);

    const {
      minAge = 18,
      maxAge = 100,
      minFame = 0,
      maxFame = 1000,
      maxDistance = 100,
      tags = [],
      sortBy = 'distance',
      sortDir = 'asc',
    } = query;

    const sortMap = {
      age: 'p.age',
      distance: 'distance',
      fame: 'p.fame_rating',
      tags: 'common_tags',
    };

    const orderBy = sortMap[sortBy] || 'distance';
    const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

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

        -- 📍 distance (km)
        (
          6371 * acos(
            cos(radians($2::float)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($3::float)) +
            sin(radians($2::float)) *
            sin(radians(p.latitude))
          )
        ) AS distance,

        -- 📸 full images array
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
          FROM pictures pic WHERE pic.user_id = u.id
        ) AS images,

        -- 🏷️ full tags array
        (
          SELECT COALESCE(ARRAY_AGG(t_all.name), '{}')
          FROM user_tags ut_all
          JOIN tags t_all ON t_all.id = ut_all.tag_id
          WHERE ut_all.user_id = u.id
        ) AS tags,

        -- 🔢 common tags count (Always uses $8 now, so Postgres knows its type)
        (
          SELECT COUNT(ut_common.tag_id)
          FROM user_tags ut_common
          JOIN tags t_common ON t_common.id = ut_common.tag_id
          WHERE ut_common.user_id = u.id
          AND t_common.name = ANY($8::text[])
        ) AS common_tags

      FROM users u
      JOIN profiles p ON p.user_id = u.id

      WHERE u.id != $1::int

      -- ❌ blocked
      AND u.id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = $1::int
        UNION
        SELECT blocker_id FROM blocks WHERE blocked_id = $1::int
      )

      -- ❌ swiped
      AND u.id NOT IN (
        SELECT target_id FROM swipes WHERE swiper_id = $1::int
      )

      -- ✅ AGE
      AND p.age BETWEEN $4::int AND $5::int

      -- ✅ FAME
      AND p.fame_rating BETWEEN $6::int AND $7::int

      -- ✅ DISTANCE FILTER
      AND (
        6371 * acos(
          cos(radians($2::float)) *
          cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians($3::float)) +
          sin(radians($2::float)) *
          sin(radians(p.latitude))
        )
      ) <= $9::float

      -- ✅ TAG FILTER
      ${
        tags.length
          ? `
      AND EXISTS (
        SELECT 1 FROM user_tags ut_filt
        JOIN tags t_filt ON t_filt.id = ut_filt.tag_id
        WHERE ut_filt.user_id = u.id AND t_filt.name = ANY($8::text[])
      )`
          : ''
      }

      ORDER BY ${orderBy} ${orderDir}

      LIMIT 50
      `,
      [
        userId, // $1
        me.latitude, // $2
        me.longitude, // $3
        minAge, // $4
        maxAge, // $5
        minFame, // $6
        maxFame, // $7
        tags, // $8
        maxDistance, // $9
      ],
    );

    // 🔥 Map the data exactly like getSuggestions!
    return result.rows.map((row) => {
      const images = row.images || [];

      const profileIndex = images.findIndex((img) => img.is_profile);
      const profileImage =
        profileIndex !== -1 ? images[profileIndex].url : null;

      return {
        userId: row.id,
        first_name: row.first_name,
        gender: row.gender,
        age: row.age,
        biography: row.biography,
        tags: row.tags || [],
        images,
        profileIndex,
        profileImage,
        fame_rating: row.fame_rating,
        distance: `${Number(row.distance).toFixed(1)} km`,
        is_online: row.is_online,
      };
    });
  }
}
