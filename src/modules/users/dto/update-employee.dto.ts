import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  IsMongoId,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';
import { Type } from 'class-transformer';

export class UpdateEmployeeDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'Email của nhân viên',
    example: 'employee@example.com',
    required: false,
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Mật khẩu mới của nhân viên',
    example: 'Password123@',
    required: false,
  })
  password?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Họ tên của nhân viên',
    example: 'Nguyễn Văn A',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{10,12}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  @ApiProperty({
    description: 'Số điện thoại của nhân viên',
    example: '0987654321',
    required: false,
  })
  phoneNumber?: string;

  @IsEnum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính phải là MALE, FEMALE hoặc OTHER',
  })
  @IsOptional()
  @ApiProperty({
    description: 'Giới tính của nhân viên',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  gender?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({
    description: 'Ngày sinh của nhân viên (ISO format: YYYY-MM-DD)',
    example: '1990-01-01',
    type: Date,
    required: false,
  })
  birthday?: Date;

  @IsEnum(['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'], {
    message:
      'Vai trò phải là MANAGER, RECEPTIONIST, HOUSEKEEPING hoặc ACCOUNTANT',
  })
  @IsOptional()
  @ApiProperty({
    description: 'Vai trò của nhân viên',
    example: 'MANAGER',
    enum: ['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'],
    required: false,
  })
  role?: UserRole;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Ghi chú về nhân viên',
    example: 'Nhân viên này có kinh nghiệm làm việc tại nhiều khách sạn lớn',
    required: false,
  })
  note?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Mã nhân viên',
    example: 'NV000012',
    required: false,
  })
  employeeCode?: string;

  @IsMongoId()
  @ApiProperty({
    description: 'ID của khách sạn mà nhân viên thuộc về',
    example: '60d0fe4f5311236168a109ca',
    required: true,
  })
  hotelId: string;
}
