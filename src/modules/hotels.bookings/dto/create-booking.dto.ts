import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '../schemas/booking.schema';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID của phòng',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  roomId: string;

  @ApiProperty({
    description: 'Ngày nhận phòng',
    example: '2023-10-20T14:00:00',
  })
  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Ngày trả phòng',
    example: '2023-10-25T12:00:00',
  })
  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty()
  @IsString()
  guestName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

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
    example: 'Khách yêu cầu thêm giường phụ',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Trạng thái đặt phòng',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'ID người tạo (tự động thêm từ request)',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  createdBy?: string;
}
