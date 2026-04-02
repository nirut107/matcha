import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ProfileService {
  constructor(private db: DatabaseService,
    private notificationService: NotificationService
  ) {}

  async upsertProfile(userId: number, dto: any) {
    console.log('ProfileService.upsertProfile called with userId:', userId, 'dto:', dto);
    const { gender, preference, biography, tags, age, latitude, longitude } = dto;

    await this.db.query('BEGIN');
    try {
      await this.db.query(
        `
        INSERT INTO profiles (user_id, gender, preference, biography, age, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id)
        DO UPDATE SET
          gender = EXCLUDED.gender,
          preference = EXCLUDED.preference,
          biography = EXCLUDED.biography,
          age = EXCLUDED.age,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude
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

}