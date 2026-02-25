import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { NaverAuthGuard } from './guards/naver-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { TradingUser } from 'src/trading/entities/trading-user.entity';

const RT_COOKIE = 'refresh_token';
const AT_COOKIE = 'access_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  private setRtCookie(res: Response, refreshToken: string) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie(RT_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // cross-origin 배포 환경 필수!
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      path: '/',
    });
  }

  private clearRtCookie(res: Response) {
    res.clearCookie(RT_COOKIE, { path: '/' });
  }

  private setAtCookie(res: Response, accessToken: string) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie(AT_COOKIE, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 15, // 15분
      path: '/',
    });
  }

  private clearAtCookie(res: Response) {
    res.clearCookie(AT_COOKIE, { path: '/' });
  }

  // ─────────────────────────────────────────────
  // Google OAuth
  // ─────────────────────────────────────────────
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 로그인 시작' })
  googleLogin() {
    // Passport가 Google로 리다이렉트 처리
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 콜백' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res, 'google');
  }

  // ─────────────────────────────────────────────
  // Naver OAuth
  // ─────────────────────────────────────────────
  @Public()
  @Get('naver')
  @UseGuards(NaverAuthGuard)
  @ApiOperation({ summary: 'Naver OAuth 로그인 시작' })
  naverLogin() {
    // Passport가 Naver로 리다이렉트 처리
  }

  @Public()
  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  @ApiOperation({ summary: 'Naver OAuth 콜백' })
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res, 'naver');
  }

  // ─────────────────────────────────────────────
  // AT 재발급 (Silent Refresh)
  // ─────────────────────────────────────────────
  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Access Token 재발급 (RT 쿠키 사용)' })
  @ApiResponse({
    status: 200,
    description: '새 AT 반환',
    schema: { example: { accessToken: 'eyJ...' } },
  })
  @ApiResponse({ status: 401, description: 'RT 만료 또는 유효하지 않음' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[RT_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const { accessToken, refreshToken: newRt } =
      await this.authService.refresh(refreshToken);

    // Set both AT and RT cookies
    this.setAtCookie(res, accessToken);
    this.setRtCookie(res, newRt);

    // Still return AT in JSON for backward compatibility
    return res.json({ accessToken });
  }

  // ─────────────────────────────────────────────
  // 로그아웃
  // ─────────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃 (RT 무효화)' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[RT_COOKIE];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear both AT and RT cookies
    this.clearAtCookie(res);
    this.clearRtCookie(res);

    return res.json({ message: 'Logged out successfully' });
  }

  // ─────────────────────────────────────────────
  // 내 정보 조회
  // ─────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: 'uuid',
        email: 'user@gmail.com',
        nickname: '홍길동',
        profileImageUrl: 'https://...',
        role: 'USER',
        provider: 'GOOGLE',
        lastLoginAt: '2024-02-10T02:00:00.000Z',
      },
    },
  })
  getMe(@CurrentUser() user: TradingUser) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      provider: user.provider,
      isInitialized: user.isInitialized === 1,
      lastLoginAt: user.lastLoginAt,
    };
  }

  // ─────────────────────────────────────────────
  // 공통 OAuth 콜백 처리
  // ─────────────────────────────────────────────
  private async handleOAuthCallback(req: Request, res: Response, provider: string) {
    try {
      const user = req.user as TradingUser;
      const { accessToken, refreshToken } = await this.authService.issueTokens(user);

      // Set both AT and RT as httpOnly cookies
      this.setAtCookie(res, accessToken);
      this.setRtCookie(res, refreshToken);

      this.logger.log(`✅ OAuth login success: ${user.email} (${provider})`);

      // Decode return URL from state parameter
      let returnUrl = '/';
      try {
        const state = req.query.state as string;
        if (state) {
          returnUrl = Buffer.from(state, 'base64').toString('utf-8');

          // Security: Validate same-origin to prevent open redirect attacks
          const returnUrlObj = new URL(returnUrl, this.frontendUrl);
          const frontendOrigin = new URL(this.frontendUrl).origin;
          if (returnUrlObj.origin !== frontendOrigin) {
            this.logger.warn(
              `❌ Invalid return URL origin: ${returnUrlObj.origin}, expected: ${frontendOrigin}`,
            );
            returnUrl = '/';
          }
        }
      } catch {
        this.logger.warn('Invalid state parameter, using default redirect');
        returnUrl = '/';
      }

      // Redirect to return URL instead of /auth/callback
      return res.redirect(`${this.frontendUrl}${returnUrl}`);
    } catch (err) {
      this.logger.error(`❌ OAuth callback error (${provider})`, err.message);
      return res.redirect(`${this.frontendUrl}/auth/error?reason=oauth_failed`);
    }
  }
}
