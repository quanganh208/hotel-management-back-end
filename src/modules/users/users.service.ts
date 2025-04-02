import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { Model, SortOrder, Types } from 'mongoose';
import { hashPassword } from '@/helpers/util';
import aqp from 'api-query-params';
import { RegisterDto } from '@/auth/dto/register.dto';
import * as dayjs from 'dayjs';
import { ActivateAccountDto } from '@/auth/dto/activate-account.dto';
import { GoogleUserData } from './types/user.types';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private async checkUserExists(
    email?: string,
    excludeId?: string,
  ): Promise<void> {
    const query = excludeId ? { _id: { $ne: excludeId } } : { email };

    const isUserExist = await this.userModel.findOne(query);
    if (isUserExist) {
      throw new BadRequestException(
        'Email đã tồn tại, vui lòng sử dụng email khác',
      );
    }
  }

  private validateMongoId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }

  async create(createUserDto: CreateUserDto) {
    await this.checkUserExists(createUserDto.email);
    const hashedPassword = await hashPassword(createUserDto.password);
    await new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    }).save();

    return {
      message: 'Tạo tài khoản thành công',
    };
  }

  async findAll(query: string, page: number, limit: number) {
    const { filter, sort } = aqp(query);
    if (filter.page) delete filter.page;
    if (!page) page = 1;
    if (!limit) limit = 10;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    const results = await this.userModel
      .find(filter)
      .select('-password')
      .limit(limit)
      .skip(limit * (page - 1))
      .sort(sort as { [key: string]: SortOrder });

    return {
      totalItems,
      totalPages,
      results,
    };
  }

  async findOne(id: string): Promise<User> {
    this.validateMongoId(id);

    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.validateMongoId(id);

    await this.checkUserExists(id);

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await user.updateOne(updateUserDto);

    return {
      message: 'Cập nhật thông tin người dùng thành công',
    };
  }

  async remove(id: string) {
    this.validateMongoId(id);

    await this.checkUserExists(id);

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await user.deleteOne();

    return {
      message: 'Xóa người dùng thành công',
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    this.validateMongoId(id);
    return this.userModel.findById(id);
  }

  async findByResetToken(resetToken: string) {
    return this.userModel.findOne({ resetToken });
  }

  async createGoogleUser(userData: GoogleUserData): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    return await new this.userModel({
      email: userData.email,
      name: userData.name,
      googleId: userData.googleId,
      image: userData.image,
      accountType: 'GOOGLE',
      isVerified: true,
    }).save();
  }

  async register(registerDto: RegisterDto) {
    await this.checkUserExists(registerDto.email);
    const hashedPassword = await hashPassword(registerDto.password);
    const verificationCode = Math.floor(10000000 + Math.random() * 90000000);
    await new this.userModel({
      ...registerDto,
      password: hashedPassword,
      isVerified: false,
      verificationCode: verificationCode,
      codeExpires: dayjs().add(1, 'hours'),
    }).save();
    return {
      message: 'Đăng ký tài khoản thành công',
    };
  }

  async activateAccount(activateAccountDto: ActivateAccountDto) {
    const { email, verificationCode } = activateAccountDto;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
    }

    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được kích hoạt trước đó');
    }

    if (user.verificationCode !== verificationCode) {
      throw new BadRequestException('Mã xác thực không chính xác');
    }

    if (dayjs().isAfter(user.codeExpires)) {
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    await user.updateOne({
      isVerified: true,
      verificationCode: null,
      codeExpires: null,
    });

    return {
      message: 'Kích hoạt tài khoản thành công',
    };
  }
}
