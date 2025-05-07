import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInRoomDto {
  @ApiProperty({
    description: 'ID của booking liên quan đến việc nhận phòng (nếu có)',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  bookingId?: string;

  @ApiProperty({
    description: 'Ghi chú của nhân viên lễ tân khi nhận phòng',
    example: 'Khách đã nhận phòng và thanh toán đầy đủ',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
