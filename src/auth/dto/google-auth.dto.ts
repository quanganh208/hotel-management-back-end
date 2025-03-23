import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsNotEmpty({ message: 'Token ID không được để trống' })
  @IsString({ message: 'Token ID phải là chuỗi ký tự' })
  idToken: string;
}
