import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { ForbiddenException } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';

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
    const { gender, preference, biography, tags, age, latitude, longitude } =
      dto;

    await this.db.query('BEGIN');
    try {
      await this.db.query(
        `
        INSERT INTO profiles (
          user_id, gender, preference, biography, age, latitude, longitude, is_setup
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7, TRUE)
        ON CONFLICT (user_id)
        DO UPDATE SET
          gender = EXCLUDED.gender,
          preference = EXCLUDED.preference,
          biography = EXCLUDED.biography,
          age = EXCLUDED.age,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          is_setup = TRUE
        `,
        [userId, gender, preference, biography, age, latitude, longitude],
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
        COALESCE(json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]') AS tags
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN user_tags ut ON ut.user_id = u.id
      LEFT JOIN tags t ON t.id = ut.tag_id
      WHERE p.user_id = $1
      GROUP BY p.user_id, u.username
      `,
      [userId],
    );

    if (result.rows.length === 0)
      throw new NotFoundException('Profile not found');

    return result.rows[0];
  }

  async getProfileById(userId: number) {
    return this.getMyProfile(userId);
  }

  async deleteProfile(userId: number) {
    await this.db.query(`DELETE FROM profiles WHERE user_id = $1`, [userId]);
    await this.db.query(`DELETE FROM user_tags WHERE user_id = $1`, [userId]);

    return { message: 'Profile deleted' };
  }

  async visitProfile(visitorId: number, visitedId: number) {
    await this.db.query(
      `INSERT INTO visits (visitor_id, visited_id)
       VALUES ($1, $2)`,
      [visitorId, visitedId],
    );

    await this.notificationService.create(visitedId, 'visit', {
      fromUserId: visitorId,
    });
  }

  async getSuggestions(userId: number) {
    console.log('===========', userId);
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
    console.log(me, 'aaaaaaaaaaaaaaaa');

    if (!me) {
      throw new ForbiddenException('Complete your profile first');
    }

    const result = await this.db.query(
      `
      SELECT 
        u.id,
        u.first_name,
        u.is_online,
        p.age,
        p.biography,
        p.fame_rating,
    
        -- 🔥 distance
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
          ARRAY_AGG(DISTINCT pic.url) FILTER (WHERE pic.url IS NOT NULL),
          '{}'
        ) AS images,
    
        -- 🔥 tags
        COALESCE(
          ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          '{}'
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
    
      -- ❌ swiper
      AND u.id NOT IN (
        SELECT target_id FROM swipes WHERE swiper_id = $1
      )
    
      -- ✅ gender
      AND (
        p.gender = $4 OR $4 = 'both'
      )
    
      AND (
        p.preference = $5 OR p.preference = 'both'
      )
    
      GROUP BY u.id, p.user_id
    
      ORDER BY distance ASC, p.fame_rating DESC
      LIMIT 20
      `,
      [userId, me.latitude, me.longitude, me.preference, me.gender],
    );

    return result.rows.map((row) => ({
      first_name: row.first_name,
      age: row.age,
      biography: row.biography,
      tags: row.tags || [],
      images: row.images || [],
      fame_rating: row.fame_rating,
      distance: `${row.distance.toFixed(1)} km`, // 🔥 format
      is_online: row.is_online,
    }));
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
        u.username,
        p.age,
        p.biography,
        p.fame_rating,
        pic.url AS profile_picture,
  
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
  
        -- 🏷️ common tags
        COUNT(DISTINCT ut2.tag_id) AS common_tags
  
      FROM users u
      JOIN profiles p ON p.user_id = u.id
  
      LEFT JOIN pictures pic 
        ON pic.user_id = u.id AND pic.is_profile = TRUE
  
      -- 🔥 tag matching
      LEFT JOIN user_tags ut2 ON ut2.user_id = u.id
      LEFT JOIN tags t ON t.id = ut2.tag_id
  
      WHERE u.id != $1

      AND u.id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM blocks WHERE blocked_id = $1
      )
    
      AND u.id NOT IN (
        SELECT target_id FROM swipes WHERE swiper_id = $1
      )
  
      -- ✅ AGE
      AND p.age BETWEEN $4 AND $5
  
      -- ✅ FAME
      AND p.fame_rating BETWEEN $6 AND $7
  
      -- ✅ TAG FILTER (if provided)
      ${tags.length ? `AND t.name = ANY($8)` : ''}
  
      GROUP BY u.id, p.age, p.biography, p.fame_rating, pic.url
  
      HAVING
        -- 📍 distance filter
        (
          6371 * acos(
            cos(radians($2)) *
            cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($3)) +
            sin(radians($2)) *
            sin(radians(p.latitude))
          )
        ) <= $9
  
      ORDER BY ${orderBy} ${orderDir}
  
      LIMIT 50
      `,
      [
        userId,
        me.latitude,
        me.longitude,
        minAge,
        maxAge,
        minFame,
        maxFame,
        tags, // $8
        maxDistance, // $9
      ],
    );

    return result.rows;
  }
}
