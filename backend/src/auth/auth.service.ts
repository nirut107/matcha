import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

type RefreshTokenRow = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string, res: Response) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE username = $1',
      [username],
    );

    const user = result.rows[0];
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Wrong password');

    const { accessToken, refreshToken } =
    await this.generateTokens(user.id);

    await this.storeRefreshToken(user.id, refreshToken);

    this.setCookies(res, accessToken, refreshToken);

    return { success: true };
  }

  async register(dto: RegisterDto, res: Response) {
    const { username, email, password } = dto;
    console.log(username,password, email)
    const existing = await this.db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email],
    );
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      if (existingUser.username === username) {
        throw new UnauthorizedException('Username already taken');
      }
      if (existingUser.email === email) {
        throw new UnauthorizedException('Email already registered');
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, password_hash],
    );

    const { accessToken, refreshToken } =
    await this.generateTokens(user.id);

    await this.storeRefreshToken(user.id, refreshToken);

    this.setCookies(res, accessToken, refreshToken);

    return { success: true };
  }

  async oauthLogin(profile: any, res: Response) {
    console.log('OAuth profile:', profile);
    const { email, googleId } = profile;

    let user = await this.db.query(
      `SELECT * FROM users WHERE email = $1 OR google_id = $2`,
      [email, googleId],
    );

    if (user.rows.length === 0) {
      const username =
        email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);

      const newUser = await this.db.query(
        `
        INSERT INTO users (
          email,
          username,
          password_hash,
          google_id,
          is_verified
        )
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
        `,
        [email, username, null, googleId],
      );
      console.log('NEW USER RAW:', newUser);
      console.log('ROWS:', newUser?.rows);
      user = newUser.rows[0];
    }

    console.log('User after OAuth query:', user);
    const { accessToken, refreshToken } =
    await this.generateTokens(user.id);

    await this.storeRefreshToken(user.id, refreshToken);

    this.setCookies(res, accessToken, refreshToken);

    return res.redirect('http://localhost:3000/dashboard');
  }

  async storeRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);

    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, hash],
    );
  }

  async refresh(refreshToken: string, res: Response) {
    let payload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException();
    }

    const userId = payload.sub;

    const tokens = await this.db.query(
      `SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = false`,
      [userId],
    );

    let validToken :RefreshTokenRow | null = null;

    for (const token of tokens.rows) {
      const match = await bcrypt.compare(refreshToken, token.token_hash);
      if (match) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      await this.db.query(
        `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`,
        [userId],
      );
      throw new UnauthorizedException('Token reuse detected');
    }

    await this.db.query(
      `UPDATE refresh_tokens SET revoked = true WHERE id = $1`,
      [validToken.id],
    );

    const { accessToken, refreshToken: newRefresh } =
      await this.generateTokens(userId);

    await this.storeRefreshToken(userId, newRefresh);

    this.setCookies(res, accessToken, newRefresh);

    return { success: true };
  }

  async generateTokens(userId: number) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
