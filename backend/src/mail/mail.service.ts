// mail.service.ts
import * as nodemailer from 'nodemailer';
import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MailService {
  private transporter;

  constructor(private db: DatabaseService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    console.log(url, token)

    await this.transporter.sendMail({
      from: `${process.env.EMAIL_FROM}`,
      to: email,
      subject: 'Verify your Matcha account ✔',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h1 style="color: #FF416C;">Welcome to MATCHA!</h1>
          <p>Please click the button below to verify your email address:</p>
          <a href="${url}" style="background-color: #FF416C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link: <br> ${url}</p>
        </div>
      `,
    });
  }

  async verifyEmail(token: string) {
    console.log(token)
    const result = await this.db.query(
      'SELECT id FROM users WHERE verification_token = $1',
      [token],
    );

    const user = result.rows[0];
    if (!user) throw new BadRequestException('Invalid or expired token');
    console.log(user)
    await this.db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
      [user.id],
    );

    return { success: true, message: 'Email verified successfully' };
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: '"MATCHA Support" <no-reply@matcha.com>',
      to: email,
      subject: 'Reset your MATCHA password 🔑',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #FF416C;">Forgot your password?</h2>
          <p>No worries! Click the button below to set a new one. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: linear-gradient(to right, #FF416C, #FF4B2B); color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }
}
