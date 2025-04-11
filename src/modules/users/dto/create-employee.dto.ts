import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsMongoId,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email của nhân viên',
    example: 'employee@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Mật khẩu của nhân viên',
    example: 'Password123@',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Họ tên của nhân viên',
    example: 'Nguyễn Văn A',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,12}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  @ApiProperty({
    description: 'Số điện thoại của nhân viên',
    example: '0987654321',
  })
  phoneNumber: string;

  @IsEnum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính phải là MALE, FEMALE hoặc OTHER',
  })
  @IsNotEmpty()
  @ApiProperty({
    description: 'Giới tính của nhân viên',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  gender: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Ngày sinh của nhân viên (ISO format: YYYY-MM-DD)',
    example: '1990-01-01',
    type: Date,
  })
  birthday: Date;

  @IsEnum(['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'], {
    message:
      'Vai trò phải là MANAGER, RECEPTIONIST, HOUSEKEEPING hoặc ACCOUNTANT',
  })
  @IsNotEmpty()
  @ApiProperty({
    description: 'Vai trò của nhân viên',
    example: 'MANAGER',
    enum: ['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'],
  })
  role: UserRole;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID của khách sạn mà nhân viên thuộc về',
    example: '60d0fe4f5311236168a109ca',
  })
  hotelId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Đường dẫn hình ảnh của nhân viên',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  image?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Ghi chú về nhân viên',
    example: 'Nhân viên này có kinh nghiệm làm việc tại nhiều khách sạn lớn',
    required: false,
  })
  note?: string;
}
