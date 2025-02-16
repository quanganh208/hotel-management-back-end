import { Controller, Post, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LocalAuthGuard } from '@/auth/passport/local-auth.guard';
import { UserDocument } from '@/modules/users/schemas/user.schema';
import { Public } from '@/decorator/customize';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Public()
  login(@Req() req: Request) {
    return this.authService.login(req.user as UserDocument);
  }

  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
