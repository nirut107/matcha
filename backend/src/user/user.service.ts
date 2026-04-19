import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    private db: DatabaseService,
    private mailService: MailService,
  ) {}

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

    if (existing.rows.length > 0 && existing.rows[0].id == userId) {
      return { message: 'Email did not change' };
    }

    if (existing.rows.length > 0) {
      throw new BadRequestException('Email already in use');
    }
    const verificationToken = uuidv4();

    await this.db.query(
      `UPDATE users SET email = $1, is_verified = $3, verification_token = $4  WHERE id = $2`,
      [email, userId, false, verificationToken],
    );

    await this.mailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Email updated successfully, please verify your email' };
  }
}
