import { ro } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { create } from 'domain';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class VisitService {
  constructor(private db: DatabaseService) {}

  async getProfileVisits(userId: number) {
    const result = await this.db.query(
      `SELECT 
  v.visitor_id AS "userId",
  v.created_at,

  p.first_name,
  p.age,
  p.biography,
  p.fame_rating,

  (
    6371 * acos(
      cos(radians($1)) *
      cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians($1)) +
      sin(radians($1)) *
      sin(radians(p.latitude))
    )
  ) AS distance,

  u.is_online,

  -- profile image
  (
    SELECT url 
    FROM pictures 
    WHERE user_id = v.visitor_id AND is_profile = true 
    LIMIT 1
  ) AS "profileImage",

  -- all images
  (
    SELECT json_agg(json_build_object('url', url))
    FROM pictures
    WHERE user_id = v.visitor_id
  ) AS images,

  -- tags
  (
    SELECT json_agg(t.name)
    FROM user_tags ut
    JOIN tags t ON t.id = ut.tag_id
    WHERE ut.user_id = v.visitor_id
  ) AS tags

FROM visits v
JOIN profiles p ON v.visitor_id = p.user_id
JOIN users u ON u.id = v.visitor_id  -- ✅ THIS WAS MISSING

WHERE v.visited_id = $1
ORDER BY v.created_at DESC;`,
      [userId],
    );

    return result.rows.map((row, index) => ({
      first_name: row.first_name,
      age: row.age,
      biography: row.biography ?? '',
      tags: row.tags ?? [],
      images: row.images ?? [],
      fame_rating: row.fame_rating ?? 0,
      distance: row.distance,
      is_online: row.is_online,
      userId: row.userId,
      profileIndex: index,
      profileImage: row.profileImage ?? '',
      create_at: row.create_at,
    }));
  }
}
