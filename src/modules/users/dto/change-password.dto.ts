import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty({
    description: 'Mật khẩu hiện tại của người dùng',
    example: 'Pass123',
  })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @ApiProperty({
    description: 'Mật khẩu mới của người dùng',
    example: 'Pass123',
  })
  newPassword: string;
}
