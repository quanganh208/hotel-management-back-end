import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoomStatus } from '../schemas/room.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomStatusDto {
  @ApiProperty({
    description: 'Trạng thái phòng',
    enum: RoomStatus,
    example: RoomStatus.AVAILABLE,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(RoomStatus)
  status: RoomStatus;
}
