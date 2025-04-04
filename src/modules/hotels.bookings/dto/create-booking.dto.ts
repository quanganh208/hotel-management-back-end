import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

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
    example: '2023-10-20',
  })
  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Ngày trả phòng',
    example: '2023-10-25',
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
    description: 'ID người tạo (tự động thêm từ request)',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  createdBy?: string;
}
