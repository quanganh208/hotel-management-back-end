import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { hashPassword } from '@/helpers/util';
import { RegisterDto } from '@/auth/dto/register.dto';
import * as dayjs from 'dayjs';
import { ActivateAccountDto } from '@/auth/dto/activate-account.dto';
import { GoogleUserData } from './types/user.types';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Hotel, HotelDocument } from '@/modules/hotels/schemas/hotel.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import {
  generate2faSecret,
  verify2faToken,
  generateQRCodeDataURL,
  generateBackupCodes,
} from '@/helpers/util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
  ) {}

  private async checkUserExists(email: string): Promise<void> {
    const isUserExist = await this.userModel.findOne({ email });
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

  private async generateEmployeeCode(): Promise<string> {
    // Lấy nhân viên cuối cùng để xác định mã tiếp theo
    const lastEmployee = await this.userModel
      .findOne({ employeeCode: { $exists: true } })
      .sort({ employeeCode: -1 })
      .limit(1);

    let nextNumber = 1;
    const prefix = 'NV';

    if (lastEmployee && lastEmployee.employeeCode) {
      // Trích xuất phần số từ mã nhân viên
      const currentNumber = parseInt(
        lastEmployee.employeeCode.substring(2),
        10,
      );
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    // Định dạng số thành chuỗi 6 ký tự với các số 0 ở đầu nếu cần
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    return `${prefix}${paddedNumber}`;
  }

  async createEmployee(userId: string, createEmployeeDto: CreateEmployeeDto) {
    const owner = await this.findById(userId);
    if (!owner || owner.role !== 'OWNER') {
      throw new ForbiddenException('Bạn không có quyền tạo nhân viên');
    }

    this.validateMongoId(createEmployeeDto.hotelId);
    const hotelObjectId = new Types.ObjectId(createEmployeeDto.hotelId);

    const isOwnerOfHotel = owner.hotels.some((hotelId) =>
      hotelId.equals(hotelObjectId),
    );

    if (!isOwnerOfHotel) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo nhân viên cho khách sạn này',
      );
    }

    await this.checkUserExists(createEmployeeDto.email);
    const hashedPassword = await hashPassword(createEmployeeDto.password);

    // Tạo mã nhân viên tự động
    const employeeCode = await this.generateEmployeeCode();

    const newEmployee = await new this.userModel({
      email: createEmployeeDto.email,
      password: hashedPassword,
      name: createEmployeeDto.name,
      phoneNumber: createEmployeeDto.phoneNumber,
      gender: createEmployeeDto.gender,
      birthday: createEmployeeDto.birthday,
      role: createEmployeeDto.role,
      image: createEmployeeDto.image,
      isVerified: true,
      accountType: 'LOCAL',
      hotels: [hotelObjectId],
      employeeCode: employeeCode,
      note: createEmployeeDto.note,
    }).save();

    // Cập nhật danh sách staff của khách sạn, thêm nhân viên mới vào
    await this.hotelModel.findByIdAndUpdate(hotelObjectId, {
      $push: { staff: newEmployee._id },
    });

    return {
      message: 'Tạo nhân viên thành công',
      data: {
        _id: newEmployee._id,
        email: newEmployee.email,
        name: newEmployee.name,
        role: newEmployee.role,
        phoneNumber: newEmployee.phoneNumber,
        gender: newEmployee.gender,
        birthday: newEmployee.birthday,
        hotelId: createEmployeeDto.hotelId,
        employeeCode: newEmployee.employeeCode,
        note: newEmployee.note,
        image: newEmployee.image,
      },
    };
  }

  async getEmployeesByHotel(userId: string, hotelId: string) {
    this.validateMongoId(hotelId);
    const hotelObjectId = new Types.ObjectId(hotelId);

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra xem người dùng có quyền quản lý khách sạn này không
    const hasAccess = user.hotels.some((id) => id.equals(hotelObjectId));
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập khách sạn này');
    }

    // Tìm tất cả nhân viên thuộc khách sạn này
    return this.userModel
      .find({
        hotels: { $in: [hotelObjectId] },
        _id: { $ne: user._id }, // Loại trừ người dùng hiện tại
      })
      .select('-password -verificationCode -codeExpires -resetToken');
  }

  async updateEmployee(
    userId: string,
    employeeId: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    // Kiểm tra người dùng hiện tại có phải là OWNER không
    const owner = await this.findById(userId);
    if (!owner || owner.role !== 'OWNER') {
      throw new ForbiddenException('Bạn không có quyền cập nhật nhân viên');
    }

    // Kiểm tra nhân viên có tồn tại không
    this.validateMongoId(employeeId);
    const employee = await this.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // Kiểm tra xem owner có quản lý khách sạn của nhân viên này không
    const isEmployeeOfOwner = employee.hotels.some((hotelId) =>
      owner.hotels.some((ownerHotelId) => ownerHotelId.equals(hotelId)),
    );

    if (!isEmployeeOfOwner) {
      throw new ForbiddenException('Bạn không có quyền cập nhật nhân viên này');
    }

    // Nếu cập nhật email, kiểm tra email mới không trùng với email hiện có
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingUserWithEmail = await this.userModel
        .findOne({ email: updateEmployeeDto.email })
        .exec();

      if (existingUserWithEmail) {
        throw new BadRequestException(
          'Email đã được sử dụng bởi người dùng khác',
        );
      }
    }

    // Nếu có cập nhật mật khẩu, hash mật khẩu mới
    if (updateEmployeeDto.password) {
      updateEmployeeDto.password = await hashPassword(
        updateEmployeeDto.password,
      );
    }

    // Cập nhật thông tin nhân viên
    const updatedEmployee = await this.userModel
      .findByIdAndUpdate(employeeId, updateEmployeeDto, { new: true })
      .select('-password -verificationCode -codeExpires -resetToken');

    if (!updatedEmployee) {
      throw new NotFoundException('Không thể cập nhật thông tin nhân viên');
    }

    return {
      message: 'Cập nhật nhân viên thành công',
      data: updatedEmployee,
    };
  }

  async removeEmployee(userId: string, employeeId: string) {
    // Kiểm tra người dùng hiện tại có phải là OWNER không
    const owner = await this.findById(userId);
    if (!owner || owner.role !== 'OWNER') {
      throw new ForbiddenException('Bạn không có quyền xóa nhân viên');
    }

    // Kiểm tra nhân viên có tồn tại không
    this.validateMongoId(employeeId);
    const employee = await this.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // Kiểm tra xem owner có quản lý khách sạn của nhân viên này không
    const isEmployeeOfOwner = employee.hotels.some((hotelId) =>
      owner.hotels.some((ownerHotelId) => ownerHotelId.equals(hotelId)),
    );

    if (!isEmployeeOfOwner) {
      throw new ForbiddenException('Bạn không có quyền xóa nhân viên này');
    }

    // Xóa nhân viên
    const deletedEmployee = await this.userModel.findByIdAndDelete(employeeId);

    if (!deletedEmployee) {
      throw new NotFoundException('Không thể xóa nhân viên');
    }

    return {
      message: 'Xóa nhân viên thành công',
    };
  }

  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    // Kiểm tra người dùng có tồn tại không
    this.validateMongoId(userId);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Nếu cập nhật email, kiểm tra email mới không trùng với email hiện có
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserWithEmail = await this.userModel
        .findOne({ email: updateUserDto.email })
        .exec();

      if (existingUserWithEmail) {
        throw new BadRequestException(
          'Email đã được sử dụng bởi người dùng khác',
        );
      }
    }

    // Nếu có cập nhật mật khẩu, hash mật khẩu mới
    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }

    // Cập nhật thông tin người dùng
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, { new: true })
      .select('-password -verificationCode -codeExpires -resetToken');

    if (!updatedUser) {
      throw new NotFoundException('Không thể cập nhật thông tin người dùng');
    }

    return {
      message: 'Cập nhật thông tin thành công',
      data: updatedUser,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Kiểm tra người dùng có tồn tại không
    this.validateMongoId(userId);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra mật khẩu hiện tại có đúng không
    if (!user.password) {
      throw new BadRequestException('Tài khoản không sử dụng mật khẩu cục bộ');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await hashPassword(changePasswordDto.newPassword);

    // Cập nhật mật khẩu mới
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  async setup2fa(
    userId: string,
  ): Promise<{ otpAuthUrl: string; qrCodeUrl: string }> {
    // Kiểm tra người dùng có tồn tại không
    this.validateMongoId(userId);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra xem 2FA đã được bật chưa
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Xác thực hai yếu tố đã được bật');
    }

    // Tạo secret 2FA và lưu vào database (chưa kích hoạt)
    const secret = generate2faSecret(user.email);

    if (!secret.base32 || !secret.otpauth_url) {
      throw new BadRequestException('Không thể tạo secret 2FA');
    }

    // Lưu secret vào database (chưa kích hoạt 2FA)
    await this.userModel.findByIdAndUpdate(userId, {
      twoFactorSecret: secret.base32,
    });

    // Tạo QR code để người dùng quét
    const qrCodeUrl = await generateQRCodeDataURL(secret.otpauth_url);

    return {
      otpAuthUrl: secret.otpauth_url,
      qrCodeUrl: qrCodeUrl,
    };
  }

  async verify2fa(
    userId: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    // Kiểm tra người dùng có tồn tại không
    this.validateMongoId(userId);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra xem người dùng có secret 2FA không
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Chưa thiết lập xác thực hai yếu tố');
    }

    // Kiểm tra xem 2FA đã được bật chưa
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Xác thực hai yếu tố đã được bật');
    }

    // Xác thực mã
    const isValid = verify2faToken(code, user.twoFactorSecret);
    if (!isValid) {
      throw new BadRequestException('Mã xác thực không hợp lệ');
    }

    // Tạo backup codes
    const backupCodes = generateBackupCodes();

    // Bật 2FA và lưu backup codes
    await this.userModel.findByIdAndUpdate(userId, {
      isTwoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes,
    });

    return { backupCodes };
  }

  async disable2fa(userId: string, code: string): Promise<{ message: string }> {
    // Kiểm tra người dùng có tồn tại không
    this.validateMongoId(userId);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra xem 2FA đã được bật chưa
    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('Xác thực hai yếu tố chưa được bật');
    }

    // Xác thực mã
    const isCodeValid = verify2faToken(code, user.twoFactorSecret);

    // Nếu mã không hợp lệ, kiểm tra xem có phải là backup code không
    if (!isCodeValid && !user.twoFactorBackupCodes.includes(code)) {
      throw new BadRequestException('Mã xác thực không hợp lệ');
    }

    // Tắt 2FA
    await this.userModel.findByIdAndUpdate(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });

    return { message: 'Đã tắt xác thực hai yếu tố thành công' };
  }

  async validate2faCode(userId: string, code: string): Promise<boolean> {
    // Kiểm tra người dùng có tồn tại không
    this.validateMongoId(userId);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra xem 2FA đã được bật chưa
    if (!user.isTwoFactorEnabled) {
      return true; // 2FA chưa bật, không cần xác thực
    }

    // Xác thực mã
    const isCodeValid = verify2faToken(code, user.twoFactorSecret);

    // Nếu mã không hợp lệ, kiểm tra xem có phải là backup code không
    if (!isCodeValid && !user.twoFactorBackupCodes.includes(code)) {
      return false;
    }

    // Nếu đó là backup code, xóa backup code khỏi danh sách
    if (!isCodeValid && user.twoFactorBackupCodes.includes(code)) {
      await this.userModel.findByIdAndUpdate(userId, {
        $pull: { twoFactorBackupCodes: code },
      });
    }

    return true;
  }
}
