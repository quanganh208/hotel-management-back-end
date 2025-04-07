import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { RoomStatus } from '../schemas/room.schema';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomStatusLogDto {
  @ApiProperty({
    description: 'ID của phòng',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  roomId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Trạng thái phòng mới',
    enum: RoomStatus,
    example: RoomStatus.CLEANING,
  })
  @IsEnum(RoomStatus)
  status: RoomStatus;

  @ApiProperty({
    description: 'Trạng thái phòng trước đó',
    enum: RoomStatus,
    example: RoomStatus.CHECKED_OUT,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  previousStatus?: RoomStatus;

  @ApiProperty({
    description: 'ID của người thay đổi',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  changedBy: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Ghi chú về việc thay đổi trạng thái',
    example: 'Dọn dẹp sau khi khách check-out',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
