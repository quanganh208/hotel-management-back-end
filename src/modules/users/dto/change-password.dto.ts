import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty({
    description: 'Mật khẩu hiện tại của người dùng',
    example: 'Password123@',
  })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Mật khẩu mới phải chứa ít nhất một chữ cái viết thường, một chữ cái viết hoa, một số và một ký tự đặc biệt',
    },
  )
  @ApiProperty({
    description: 'Mật khẩu mới của người dùng',
    example: 'NewPassword123@',
  })
  newPassword: string;
}
