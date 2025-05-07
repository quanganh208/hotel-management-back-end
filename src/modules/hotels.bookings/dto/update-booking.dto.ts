import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto {
  @ApiProperty({
    description: 'Ngày nhận phòng',
    example: '2023-10-20T14:00:00',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @ApiProperty({
    description: 'Ngày trả phòng',
    example: '2023-10-25T12:00:00',
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

  @ApiProperty({
    description: 'Số lượng khách',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Khách yêu cầu thêm giường phụ',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
