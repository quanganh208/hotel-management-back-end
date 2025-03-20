import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswords, hashPassword } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import * as process from 'node:process';
import { UserDocument } from '@/modules/users/schemas/user.schema';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

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

  async resendActivation(resendActivationDto: ResendActivationDto) {
    const user = await this.usersService.findByEmail(resendActivationDto.email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được kích hoạt trước đó');
    }

    const verificationCode = Math.floor(10000000 + Math.random() * 90000000);
    await user.updateOne({
      verificationCode: verificationCode,
      codeExpires: dayjs().add(1, 'hours'),
    });

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
      message: 'Mã kích hoạt mới đã được gửi đến email của bạn',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    const verificationCode = Math.floor(10000000 + Math.random() * 90000000);
    await user.updateOne({
      verificationCode: verificationCode,
      codeExpires: dayjs().add(1, 'hours'),
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Đặt lại mật khẩu tại website Hotel Management',
      template: 'forgot-password',
      context: {
        name: user.name,
        code: verificationCode,
        year: new Date().getFullYear(),
      },
    });

    return {
      message: 'Mã xác thực đã được gửi đến email của bạn',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(resetPasswordDto.email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (!user.verificationCode || !user.codeExpires) {
      throw new BadRequestException('Bạn chưa yêu cầu đặt lại mật khẩu');
    }

    if (user.verificationCode !== resetPasswordDto.verificationCode) {
      throw new BadRequestException('Mã xác thực không chính xác');
    }

    if (dayjs().isAfter(user.codeExpires)) {
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    const hashedPassword = await hashPassword(resetPasswordDto.newPassword);
    await user.updateOne({
      password: hashedPassword,
      verificationCode: null,
      codeExpires: null,
    });

    return {
      message: 'Đặt lại mật khẩu thành công',
    };
  }

  async resendForgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (!user.verificationCode || !user.codeExpires) {
      throw new BadRequestException('Bạn chưa yêu cầu đặt lại mật khẩu');
    }

    const verificationCode = Math.floor(10000000 + Math.random() * 90000000);
    await user.updateOne({
      verificationCode: verificationCode,
      codeExpires: dayjs().add(1, 'hours'),
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Đặt lại mật khẩu tại website Hotel Management',
      template: 'forgot-password',
      context: {
        name: user.name,
        code: verificationCode,
        year: new Date().getFullYear(),
      },
    });

    return {
      message: 'Mã xác thực mới đã được gửi đến email của bạn',
    };
  }
}
