import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { LocalAuthGuard } from '@/auth/passport/local-auth.guard';
import { UserDocument } from '@/modules/users/schemas/user.schema';
import { Public } from '@/decorator/customize';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendActivationDto } from '@/auth/dto/send-activation.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Public()
  login(@Req() req: Request) {
    return this.authService.login(req.user as UserDocument);
  }

  @Post('register')
  @Public()
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('activate')
  @Public()
  activate(@Body() activateAccountDto: ActivateAccountDto) {
    return this.authService.activate(activateAccountDto);
  }

  @Post('send-activation')
  @Public()
  resendActivation(@Body() sendActivationDto: SendActivationDto) {
    return this.authService.sendActivation(sendActivationDto);
  }

  @Post('forgot-password')
  @Public()
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('google-auth')
  @Public()
  googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto);
  }
}
