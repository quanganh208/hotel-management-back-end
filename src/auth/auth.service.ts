import { Injectable } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePasswords } from '@/helpers/util';
import { JwtService } from '@nestjs/jwt';
import * as process from 'node:process';
import { UserDocument } from '@/modules/users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
}
