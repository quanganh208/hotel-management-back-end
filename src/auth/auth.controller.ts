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
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công.' })
  @ApiResponse({ status: 401, description: 'Đăng nhập không thành công.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'user@example.com',
          description: 'Email của người dùng',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: 'Mật khẩu của người dùng',
        },
      },
    },
  })
  login(@Req() req: Request) {
    return this.authService.login(req.user as UserDocument);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('activate')
  @Public()
  @ApiOperation({ summary: 'Kích hoạt tài khoản' })
  @ApiResponse({ status: 200, description: 'Kích hoạt thành công.' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc mã hết hạn.',
  })
  activate(@Body() activateAccountDto: ActivateAccountDto) {
    return this.authService.activate(activateAccountDto);
  }

  @Post('send-activation')
  @Public()
  @ApiOperation({ summary: 'Gửi lại mã kích hoạt' })
  @ApiResponse({ status: 200, description: 'Gửi mã kích hoạt thành công.' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại.' })
  resendActivation(@Body() sendActivationDto: SendActivationDto) {
    return this.authService.sendActivation(sendActivationDto);
  }

  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Quên mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Gửi email đặt lại mật khẩu thành công.',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại.' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Đặt lại mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đặt lại mật khẩu thành công.' })
  @ApiResponse({
    status: 400,
    description: 'Token không hợp lệ hoặc đã hết hạn.',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('google-auth')
  @Public()
  @ApiOperation({ summary: 'Đăng nhập bằng Google' })
  @ApiResponse({ status: 200, description: 'Đăng nhập Google thành công.' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ.' })
  googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto);
  }
}
