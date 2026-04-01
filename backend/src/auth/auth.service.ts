import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private db: DatabaseService) {}

  async login(username: string, password: string) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE username = $1',
      [username],
    );

    const user = result.rows[0];
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Wrong password');

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  async register(dto: RegisterDto) {
    const { username, email, password } = dto;

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
    
    const result = await this.db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, password_hash],
    );

    const token = jwt.sign({ userId: result.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
    
    return {
      access_token: token,
      user: {
        id: result.rows[0].id,
        username,
      }, 
    };
  }

  async oauthLogin(profile: any) {
    console.log('OAuth profile:', profile);
    const { email,googleId } = profile;
  
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
        [
          email,
          username,
          null,
          googleId,
        ],
      );
    
      user = newUser.rows[0];
    }
  

    const currentUser = user.rows[0];
    console.log('Current user after OAuth login:', currentUser);
    const token = jwt.sign(
      { userId: currentUser.id },
      process.env.JWT_SECRET!,
    );
  
    return {
      access_token: token,
      user: user.rows[0],
    };
  }
}
