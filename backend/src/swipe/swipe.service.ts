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
    console.log('total = ', total, 'likes = ', likes);

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

      const profilesRes = await this.db.query(
        `SELECT p.user_id, p.first_name, 
                (SELECT url FROM pictures WHERE user_id = p.user_id AND is_profile = true LIMIT 1) as profile_image
         FROM profiles p WHERE p.user_id IN ($1, $2)`,
        [userId, targetId],
      );

      const myProfile = profilesRes.rows.find((r) => r.user_id === userId);
      const targetProfile = profilesRes.rows.find(
        (r) => r.user_id === targetId,
      );

      let isMatch = false;

      if (action === 'like') {
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
          await this.db.query('COMMIT');
          await this.notificationService.create(targetId, 'like', {
            senderId: userId,
            senderName: myProfile.first_name,
            senderImage: myProfile.profile_image,
            type: 'LIKE',
            text: `${myProfile.first_name} liked your profile! ✨`,
          });

          await this.notificationService.create(targetId, 'match', {
            senderId: userId,
            senderName: myProfile.first_name,
            senderImage: myProfile.profile_image,
            type: 'MATCH',
            text: `You matched with ${myProfile.first_name}! ❤️`,
          });

          await this.notificationService.create(userId, 'match', {
            senderId: targetId,
            senderName: targetProfile.first_name,
            senderImage: targetProfile.profile_image,
            type: 'MATCH',
            text: `You matched with ${targetProfile.first_name}! ❤️`,
          });
        } else {
          await this.db.query('COMMIT');
          await this.notificationService.create(targetId, 'like', {
            senderId: userId,
            senderName: myProfile.first_name,
            senderImage: myProfile.profile_image,
            type: 'LIKE',
            text: `${myProfile.first_name} liked your profile! ✨`,
          });
        }
      } else {
        await this.db.query('COMMIT');
      }

      this.updateFameRating(targetId);
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
      const myProfileRes = await this.db.query(
        `SELECT p.first_name, 
                (SELECT url FROM pictures WHERE user_id = p.user_id AND is_profile = true LIMIT 1) as profile_image
         FROM profiles p WHERE p.user_id = $1`,
        [userId],
      );
      const myProfile = myProfileRes.rows[0];

      const matchBroken = (deleteMatchRes.rowCount ?? 0) > 0;

      await this.db.query('COMMIT');
      await this.notificationService.create(targetId, 'unlike', {
        senderId: userId,
        senderName: myProfile.first_name,
        senderImage: myProfile.profile_image,
        type: 'UNLIKE',
        text: `${myProfile.first_name} unliked your profile! ✨`,
      });
      this.updateFameRating(targetId);
      return { success: true, matchBroken };
    } catch (e) {
      await this.db.query('ROLLBACK');
      throw e;
    }
  }
}
