import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Length(6, 20, { message: 'Mật khẩu phải có độ dài từ 6 kí tự trở lên' })
  password: string;

  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  name: string;
}
