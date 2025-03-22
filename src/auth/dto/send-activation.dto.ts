import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendActivationDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
