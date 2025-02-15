import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@/modules/users/schemas/user.schema';
import { Model, SortOrder, Types } from 'mongoose';
import { hashPassword } from '@/helpers/util';
import aqp from 'api-query-params';

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
}
