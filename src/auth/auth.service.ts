import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import {
  comparePasswords,
  hashPassword,
  generateResetToken,
} from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import * as process from 'node:process';
import { UserDocument } from '@/modules/users/schemas/user.schema';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { SendActivationDto } from './dto/send-activation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { Authenticate2faDto } from './dto/2fa/authenticate-2fa.dto';
import * as dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await comparePasswords(pass, user.password))) return null;
    return user;
  }

  login(user: UserDocument, isTwoFactorAuthenticated: boolean = false) {
    // Kiểm tra nếu người dùng có bật 2FA nhưng chưa xác thực 2FA
    if (user.isTwoFactorEnabled && !isTwoFactorAuthenticated) {
      return {
        message: 'Yêu cầu xác thực hai yếu tố',
        requiresTwoFactor: true,
        userId: user._id,
      };
    }

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
    return {
      message: 'Đăng nhập thành công',
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      image: user.image,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }

  async authenticate2fa(
    userId: string,
    authenticate2faDto: Authenticate2faDto,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('Người dùng chưa bật xác thực hai yếu tố');
    }

    const isValid = await this.usersService.validate2faCode(
      userId,
      authenticate2faDto.code,
    );

    if (!isValid) {
      throw new BadRequestException('Mã xác thực không hợp lệ');
    }

    // Đăng nhập người dùng với xác thực 2FA
    return this.login(user, true);
  }

  async register(registerDto: RegisterDto) {
    return await this.usersService.register(registerDto);
  }

  async activate(activateAccountDto: ActivateAccountDto) {
    return await this.usersService.activateAccount(activateAccountDto);
  }

  async sendActivation(sendActivationDto: SendActivationDto) {
    const user = await this.usersService.findByEmail(sendActivationDto.email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được kích hoạt trước đó');
    }

    let verificationCode: number;

    if (
      user.verificationCode &&
      user.codeExpires &&
      dayjs().isBefore(dayjs(user.codeExpires))
    ) {
      verificationCode = Number(user.verificationCode);
    } else {
      verificationCode = Math.floor(10000000 + Math.random() * 90000000);
      await user.updateOne({
        verificationCode: verificationCode,
        codeExpires: dayjs().add(1, 'hours').toDate(),
      });
    }

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Kích hoạt tài khoản của bạn tại website Hotel Management',
      template: 'register',
      context: {
        name: user.name,
        code: verificationCode,
        year: new Date().getFullYear(),
      },
    });

    return {
      message: 'Mã kích hoạt đã được gửi đến email của bạn',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    const resetToken = generateResetToken();

    await user.updateOne({
      resetToken: resetToken,
      codeExpires: dayjs().add(1, 'hours').toDate(),
    });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Đặt lại mật khẩu tại website Hotel Management',
      template: 'forgot-password',
      context: {
        name: user.name,
        resetUrl: resetUrl,
        year: new Date().getFullYear(),
      },
    });

    return {
      message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    if (!user.codeExpires || dayjs().isAfter(dayjs(user.codeExpires))) {
      throw new BadRequestException('Token đã hết hạn');
    }

    try {
      const hashedPassword = await hashPassword(resetPasswordDto.newPassword);

      await user.updateOne({
        password: hashedPassword,
        resetToken: null,
        codeExpires: null,
      });

      return {
        message: 'Mật khẩu đã được đặt lại thành công',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Lỗi khi đặt lại mật khẩu');
    }
  }

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    try {
      const ticket = await this.verifyGoogleIdToken(googleAuthDto.idToken);

      if (!ticket) {
        return new BadRequestException('Google ID token không hợp lệ');
      }

      const payload = ticket.getPayload();

      if (!payload) {
        return new BadRequestException(
          'Không thể lấy thông tin từ Google ID token',
        );
      }

      const { email, name, sub: googleId, picture: image } = payload;

      if (!email) {
        return new BadRequestException('Email không được cung cấp từ Google');
      }

      const existingUser = await this.usersService.findByEmail(email);

      if (existingUser) {
        if (existingUser.accountType === 'GOOGLE') {
          if (
            existingUser.googleId !== googleId ||
            existingUser.name !== name ||
            existingUser.image !== image
          ) {
            await existingUser.updateOne({
              googleId: googleId,
              name: name,
              image: image,
            });
          }
        } else {
          await existingUser.updateOne({
            googleId: googleId,
            image: existingUser.image || image,
          });
        }

        return this.login(existingUser);
      } else {
        const newUser = await this.usersService.createGoogleUser({
          email,
          name: name || '',
          googleId,
          image,
        });

        return this.login(newUser);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Lỗi khi xử lý đăng nhập với Google');
    }
  }

  private async verifyGoogleIdToken(idToken: string) {
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      return await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error('Lỗi xác thực Google ID token:', error);
      return null;
    }
  }

  // 2FA methods
  async setup2fa(userId: string) {
    return this.usersService.setup2fa(userId);
  }

  async verify2fa(userId: string, code: string) {
    return this.usersService.verify2fa(userId, code);
  }

  async disable2fa(userId: string, code: string) {
    return this.usersService.disable2fa(userId, code);
  }

  async check2faStatus(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    return {
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }
}
