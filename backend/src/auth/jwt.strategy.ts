import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// 🔥 extract token from cookie
const cookieExtractor = (req: any) => {
  return req?.cookies?.access_token || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor, // ✅ cookie
        ExtractJwt.fromAuthHeaderAsBearerToken(), // ✅ fallback
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // 👉 payload = { userId: ... }
    return { userId: payload.userId };
  }
}