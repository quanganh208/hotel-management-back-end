import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto {
  @ApiProperty({
    description: 'Ngày nhận phòng',
    example: '2023-10-20',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @ApiProperty({
    description: 'Ngày trả phòng',
    example: '2023-10-25',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
