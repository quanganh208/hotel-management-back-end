import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class WalkInCheckInDto {
  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty()
  @IsString()
  guestName: string;

  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0912345678',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Ngày nhận phòng (mặc định là ngày hiện tại)',
    example: '2025-05-06T14:00:00',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @ApiProperty({
    description: 'Ngày trả phòng dự kiến',
    example: '2025-05-08T12:00:00',
  })
  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    description: 'Số lượng khách',
    example: 2,
    default: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  guestCount: number;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Khách vãng lai, thanh toán bằng tiền mặt',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
