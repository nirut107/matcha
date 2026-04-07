import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'], // 🔥 สำคัญ
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    console.log('GOOGLE PROFILE:', profile);

    const user = {
      email: profile.emails?.[0]?.value,
      first_name: profile.name?.givenName,
      last_name: profile.name?.familyName,
      googleId: profile.id,
    };
    console.log(user)
    done(null, user);
  }
}