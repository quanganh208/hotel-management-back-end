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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { RequestWithUser } from '@/types/express';
import { Verify2faDto } from './dto/2fa/verify-2fa.dto';
import { Disable2faDto } from './dto/2fa/disable-2fa.dto';

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

  // 2FA endpoints
  @Post('2fa/authenticate')
  @Public()
  @ApiOperation({ summary: 'Xác thực với 2FA sau khi đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Xác thực 2FA thành công.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đăng nhập thành công' },
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'string', example: '24h' },
        _id: { type: 'string', example: '60d21b4667d0d8992e610c85' },
        name: { type: 'string', example: 'Nguyễn Văn A' },
        email: { type: 'string', example: 'user@example.com' },
        role: { type: 'string', example: 'OWNER' },
        accountType: { type: 'string', example: 'LOCAL' },
        image: { type: 'string', example: 'https://...' },
        isTwoFactorEnabled: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Mã xác thực không hợp lệ.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'code'],
      properties: {
        userId: {
          type: 'string',
          example: '60d21b4667d0d8992e610c85',
          description: 'ID của người dùng',
        },
        code: {
          type: 'string',
          example: '123456',
          description: 'Mã xác thực từ ứng dụng hoặc mã dự phòng',
        },
      },
    },
  })
  authenticate2fa(@Body() body: { userId: string; code: string }) {
    const { userId, code } = body;
    return this.authService.authenticate2fa(userId, { code });
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thiết lập xác thực hai yếu tố' })
  @ApiResponse({
    status: 200,
    description: 'Khởi tạo thiết lập 2FA thành công.',
    schema: {
      type: 'object',
      properties: {
        otpAuthUrl: {
          type: 'string',
          example:
            'otpauth://totp/HotelManagement:user@example.com?secret=ABCDEFGHIJKLMNOPQRSTUVWXYZ&issuer=HotelManagement',
          description: 'URL xác thực OTP cho các ứng dụng xác thực',
        },
        qrCodeUrl: {
          type: 'string',
          example: 'data:image/png;base64,iVBORw0KGgoAA...',
          description: 'QR code dạng base64 để quét bằng ứng dụng xác thực',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Lỗi khi thiết lập 2FA.' })
  setup2fa(@Req() req: RequestWithUser) {
    return this.authService.setup2fa(req.user.userId);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác thực và bật xác thực hai yếu tố' })
  @ApiResponse({
    status: 200,
    description: 'Bật 2FA thành công.',
    schema: {
      type: 'object',
      properties: {
        backupCodes: {
          type: 'array',
          items: { type: 'string' },
          example: ['a1b2c3d4', 'e5f6g7h8', 'i9j0k1l2', 'm3n4o5p6'],
          description:
            'Danh sách mã dự phòng để sử dụng khi không có thiết bị xác thực',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Mã xác thực không hợp lệ.' })
  verify2fa(@Req() req: RequestWithUser, @Body() verify2faDto: Verify2faDto) {
    return this.authService.verify2fa(req.user.userId, verify2faDto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tắt xác thực hai yếu tố' })
  @ApiResponse({
    status: 200,
    description: 'Tắt 2FA thành công.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Đã tắt xác thực hai yếu tố thành công',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Mã xác thực không hợp lệ.' })
  disable2fa(
    @Req() req: RequestWithUser,
    @Body() disable2faDto: Disable2faDto,
  ) {
    return this.authService.disable2fa(req.user.userId, disable2faDto.code);
  }
}
