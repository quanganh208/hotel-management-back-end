import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Mật khẩu mới của người dùng',
    example: 'Password123@',
    required: false,
  })
  password?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Họ tên của người dùng',
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
    description: 'Số điện thoại của người dùng',
    example: '0987654321',
    required: false,
  })
  phoneNumber?: string;

  @IsEnum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính phải là MALE, FEMALE hoặc OTHER',
  })
  @IsOptional()
  @ApiProperty({
    description: 'Giới tính của người dùng',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  gender?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({
    description: 'Ngày sinh của người dùng (ISO format: YYYY-MM-DD)',
    example: '1990-01-01',
    type: Date,
    required: false,
  })
  birthday?: Date;

  @IsString()
  @IsOptional()
  image?: string;
}
