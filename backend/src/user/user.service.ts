import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async setUserOnline(userId: number, online: boolean) {
    await this.db.query(
      `UPDATE users SET is_online = $1, last_connection = $2 WHERE id = $3`,
      [online, online ? new Date() : new Date(), userId],
    );
  }

  async updateEmail(userId: number, email: string) {
    // 🔥 check duplicate email
    const existing = await this.db.query(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );

    if (existing.rows.length > 0) {
      throw new BadRequestException('Email already in use');
    }

    await this.db.query(`UPDATE users SET email = $1 WHERE id = $2`, [
      email,
      userId,
    ]);

    return { message: 'Email updated successfully' };
  }
}
