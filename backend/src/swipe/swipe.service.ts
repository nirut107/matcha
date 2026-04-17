import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SwipeService {
  constructor(
    private db: DatabaseService,
    private notificationService: NotificationService,
  ) {}

  async updateFameRating(targetId: number) {
    const res = await this.db.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE action = 'like') AS likes
      FROM (
        SELECT action
        FROM swipes
        WHERE target_id = $1
        ORDER BY created_at DESC
        LIMIT 100) AS recent_swipes`,
      [targetId],
    );

    const total = Number(res.rows[0].total);
    const likes = Number(res.rows[0].likes);

    if (total < 10) return;

    const fame = Math.round((likes / total) * 100);

    await this.db.query(
      `
      UPDATE profiles
      SET fame_rating = $2
      WHERE user_id = $1
      `,
      [targetId, fame],
    );
  }

  async swipeUser(userId: number, targetId: number, action: 'like' | 'pass') {
    if (userId === targetId) {
      throw new Error('Invalid action');
    }

    await this.db.query('BEGIN');

    try {
      await this.db.query(
        `INSERT INTO swipes (swiper_id, target_id, action)
         VALUES ($1, $2, $3)
         ON CONFLICT (swiper_id, target_id)
         DO UPDATE SET action = EXCLUDED.action`,
        [userId, targetId, action],
      );

      const myProfileRes = await this.db.query(
        `SELECT p.first_name, 
                (SELECT url FROM pictures WHERE user_id = p.user_id AND is_profile = true LIMIT 1) as profile_image
         FROM profiles p WHERE p.user_id = $1`,
        [userId],
      );
      const myProfile = myProfileRes.rows[0];

      let isMatch = false;

      if (action === 'like') {
        await this.notificationService.create(targetId, 'like', {
          senderId: userId,
          senderName: myProfile.first_name,
          senderImage: myProfile.profile_image,
          type: 'LIKE',
          text: `${myProfile.first_name} liked your profile! ✨`,
        });

        const res = await this.db.query(
          `SELECT 1 FROM swipes WHERE swiper_id = $1 AND target_id = $2 AND action = 'like'`,
          [targetId, userId],
        );

        if (res.rows.length) {
          isMatch = true;

          await this.db.query(
            `INSERT INTO matches (user1_id, user2_id)
             VALUES (LEAST($1::int, $2::int), GREATEST($1::int, $2::int))
             ON CONFLICT DO NOTHING`,
            [userId, targetId],
          );

          await this.notificationService.create(userId, 'match', {
            withUserId: targetId,
            type: 'MATCH',
          });

          await this.notificationService.create(targetId, 'match', {
            senderId: userId,
            senderName: myProfile.first_name,
            senderImage: myProfile.profile_image,
            type: 'MATCH',
            text: `You matched with ${myProfile.first_name}! ❤️`,
          });
        }
      }

      await this.db.query('COMMIT');
      return { isMatch };
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }

  async unlikeUser(userId: number, targetId: number) {
    if (userId === targetId) {
      throw new Error('Invalid action');
    }

    await this.db.query('BEGIN');

    try {
      await this.db.query(
        `
        INSERT INTO swipes (swiper_id, target_id, action)
        VALUES ($1, $2, 'pass')
        ON CONFLICT (swiper_id, target_id)
        DO UPDATE SET action = 'pass'
        `,
        [userId, targetId],
      );

      const deleteMatchRes = await this.db.query(
        `
        DELETE FROM matches
        WHERE user1_id = LEAST($1::int, $2::int)
          AND user2_id = GREATEST($1::int, $2::int)
        RETURNING id
        `,
        [Number(userId), Number(targetId)],
      );

      const matchBroken = (deleteMatchRes.rowCount ?? 0) > 0;

      await this.db.query('COMMIT');

      return { success: true, matchBroken };
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }
}
