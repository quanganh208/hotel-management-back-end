import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Disable2faDto {
  @ApiProperty({
    description: 'Mã xác thực từ ứng dụng xác thực hai yếu tố hoặc mã dự phòng',
    example: '123456',
    required: true,
  })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
  code: string;
}
