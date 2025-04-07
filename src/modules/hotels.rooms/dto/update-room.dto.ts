import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { RoomStatus } from '../schemas/room.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomDto {
  @ApiProperty({
    description: 'Số phòng',
    example: '101',
    required: false,
  })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiProperty({
    description: 'ID của hạng phòng',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  roomTypeId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tầng',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiProperty({
    description: 'Trạng thái phòng',
    enum: RoomStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiProperty({
    description: 'Đường dẫn hình ảnh',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Ghi chú về phòng',
    example: 'Phòng có view đẹp, hướng ra biển',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
