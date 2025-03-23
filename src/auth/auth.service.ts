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
import * as dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

interface JwtPayload {
  sub: string;

  [key: string]: any;
}

interface TokenError {
  name: string;
  message: string;
}

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

  login(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, name: user.name };
    return {
      message: 'Đăng nhập thành công',
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN,
      _id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      image: user.image,
    };
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

    let verificationCode;

    if (
      user.verificationCode &&
      user.codeExpires &&
      dayjs().isBefore(dayjs(user.codeExpires))
    ) {
      verificationCode = user.verificationCode;
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
        code: verificationCode as number,
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
    try {
      const user = await this.usersService.findByResetToken(
        resetPasswordDto.token,
      );

      if (!user) {
        throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
      }

      if (!user.codeExpires || dayjs().isAfter(dayjs(user.codeExpires))) {
        throw new BadRequestException('Token đã hết hạn');
      }

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
}
