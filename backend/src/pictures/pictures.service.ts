import {
    Injectable,
    BadRequestException,
    ForbiddenException,
  } from '@nestjs/common';
  import { DatabaseService } from '../database/database.service';
  
  @Injectable()
  export class PicturesService {
    constructor(private db: DatabaseService) {}
  
    /**
     * 🔥 SYNC IMAGES (FULL LOGIC)
     * - old image → update position
     * - new image → insert
     * - missing old → delete
     * - reorder
     * - handle is_profile (only 1)
     */
    async syncImages(
      userId: number,
      images: any[],
      files: Express.Multer.File[],
    ) {
      if (!images || !Array.isArray(images)) {
        throw new BadRequestException('Invalid images payload');
      }
  
      if (images.length > 5) {
        throw new BadRequestException('Max 5 images allowed');
      }
  
      const positions = images.map(i => i.position);
      const uniquePositions = new Set(positions);
  
      if (positions.length !== uniquePositions.size) {
        throw new BadRequestException('Duplicate position not allowed');
      }
  
      await this.db.query('BEGIN');
  
      try {
        // 👉 1. get current images
        const dbRes = await this.db.query(
          `SELECT id FROM pictures WHERE user_id = $1`,
          [userId],
        );
  
        const dbIds = dbRes.rows.map(r => r.id);
  
        // 👉 2. separate old / new
        const incomingOld = images.filter(i => i.id);
        const incomingNew = images.filter(i => i.file);
  
        const incomingIds = incomingOld.map(i => i.id);
  
        // 👉 3. DELETE missing old
        const toDelete = dbIds.filter(id => !incomingIds.includes(id));
  
        for (const id of toDelete) {
          await this.db.query(
            `DELETE FROM pictures WHERE id = $1 AND user_id = $2`,
            [id, userId],
          );
        }
  
        // 👉 4. UPDATE old positions
        for (const img of incomingOld) {
          const result = await this.db.query(
            `
            UPDATE pictures
            SET position = $1
            WHERE id = $2 AND user_id = $3
            RETURNING id
            `,
            [img.position, img.id, userId],
          );
  
          if (result.rows.length === 0) {
            throw new ForbiddenException('Invalid picture id');
          }
        }
  
        // 👉 5. INSERT new images
        let fileIndex = 0;
  
        for (const img of incomingNew) {
          const file = files[fileIndex++];
  
          if (!file) {
            throw new BadRequestException('Missing file');
          }
  
          if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Only image files allowed');
          }
  
          const url = `/uploads/${file.filename}`;
  
          await this.db.query(
            `
            INSERT INTO pictures (user_id, url, position, is_profile)
            VALUES ($1, $2, $3, $4)
            `,
            [
              userId,
              url,
              img.position,
              img.is_profile === true, // temp
            ],
          );
        }
  
        // 👉 6. HANDLE PROFILE IMAGE (ONLY ONE)
        let profilePosition: number | null = null;
  
        // หา image ที่ FE เลือก
        const profileImage = images.find(i => i.is_profile === true);
  
        if (profileImage) {
          profilePosition = profileImage.position;
        } else {
          // fallback → position 1
          profilePosition = 1;
        }
  
        // reset ทั้งหมด
        await this.db.query(
          `UPDATE pictures SET is_profile = FALSE WHERE user_id = $1`,
          [userId],
        );
  
        // set แค่ตัวเดียว
        await this.db.query(
          `
          UPDATE pictures
          SET is_profile = TRUE
          WHERE user_id = $1 AND position = $2
          `,
          [userId, profilePosition],
        );
  
        await this.db.query('COMMIT');
  
        return { message: 'Images synced successfully' };
      } catch (e) {
        await this.db.query('ROLLBACK');
        throw e;
      }
    }
  
    // 🔥 GET MY IMAGES
    async getMyPictures(userId: number) {
      const result = await this.db.query(
        `
        SELECT id, url, is_profile, position
        FROM pictures
        WHERE user_id = $1
        ORDER BY position ASC
        `,
        [userId],
      );
  
      return result.rows;
    }
  
    async getPicturesByUserId(userId: number) {
        const result = await this.db.query(
          `SELECT id, url, is_profile, position
           FROM pictures
           WHERE user_id = $1
           ORDER BY position ASC`,
          [userId],
        );
      
        if (result.rows.length === 0) {
          throw new BadRequestException('No pictures found for this user');
        }
      
        return result.rows; 
      }

    async delete(userId: number, pictureId: number) {
      await this.db.query('BEGIN');
  
      try {
        const check = await this.db.query(
          `SELECT id FROM pictures WHERE id = $1 AND user_id = $2`,
          [pictureId, userId],
        );
  
        if (check.rows.length === 0) {
          throw new ForbiddenException('Not your picture');
        }
  
        await this.db.query(
          `DELETE FROM pictures WHERE id = $1`,
          [pictureId],
        );
  
        // reorder ใหม่
        await this.db.query(
          `
          UPDATE pictures
          SET position = sub.new_pos
          FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS new_pos
            FROM pictures
            WHERE user_id = $1
          ) sub
          WHERE pictures.id = sub.id
          `,
          [userId],
        );
  
        // ensure profile exists
        await this.db.query(
          `
          UPDATE pictures
          SET is_profile = TRUE
          WHERE id = (
            SELECT id FROM pictures
            WHERE user_id = $1
            ORDER BY position ASC
            LIMIT 1
          )
          AND NOT EXISTS (
            SELECT 1 FROM pictures WHERE user_id = $1 AND is_profile = TRUE
          )
          `,
          [userId],
        );
  
        await this.db.query('COMMIT');
  
        return { message: 'Deleted' };
      } catch (e) {
        await this.db.query('ROLLBACK');
        throw e;
      }
    }
  }