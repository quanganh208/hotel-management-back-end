import {
  IsEmail,
  IsNotEmpty,
  Length,
  IsString,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'password123',
    minLength: 6,
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Length(6, 20, { message: 'Mật khẩu phải có độ dài từ 6 kí tự trở lên' })
  password: string;

  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  name: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn ảnh đại diện',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Đường dẫn ảnh không hợp lệ' })
  image?: string;
}
