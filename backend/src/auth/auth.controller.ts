import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login success',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res) {
    return this.authService.login(body.username, body.password, res);
  }

  @Post('refresh')
  async refresh(@Req() req, @Res() res) {
    const refreshToken = req.cookies['refresh_token'];
    console.log(refreshToken);
    if (!refreshToken) throw new UnauthorizedException();

    return this.authService.refresh(refreshToken, res);
  }

  @Post('register')
  // @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Username or email already exists',
  })
  async resgister(@Body() dto: any, @Res({ passthrough: true }) res) {
    console.log("Body is:", dto); // If this is still undefined, the issue is the Request, not the Code
    return this.authService.register(dto, res);
}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    return this.authService.oauthLogin(req.user, res);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Logout successful' })
  logout(@Req() req, @Res({ passthrough: true })  res) {
    return this.authService.logout(req.user.userId, res);
  }
}
