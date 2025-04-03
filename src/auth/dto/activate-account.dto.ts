import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ActivateAccountDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  verificationCode: string;
}
