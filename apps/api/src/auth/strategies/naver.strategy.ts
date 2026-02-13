import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('NAVER_CLIENT_ID')!,
      clientSecret: configService.get<string>('NAVER_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('NAVER_CALLBACK_URL')!,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    const email = profile.email;
    const nickname = profile.nickname || profile.name || email?.split('@')[0] || 'User';
    const profileImageUrl = profile.profileImage;

    const user = await this.authService.findOrCreateUser({
      provider: 'NAVER',
      providerId: profile.id,
      email,
      nickname,
      profileImageUrl,
    });

    done(null, user);
  }
}
