import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token đặt lại mật khẩu',
    example: 'f23d7a...12ec',
  })
  @IsNotEmpty({ message: 'Token không được để trống' })
  @IsString({ message: 'Token phải là chuỗi ký tự' })
  token: string;

  @ApiProperty({
    description: 'Mật khẩu mới của người dùng',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @Length(6, 20, { message: 'Mật khẩu mới phải có độ dài từ 6 kí tự trở lên' })
  newPassword: string;
}
