import { IsOptional, IsString } from 'class-validator';
import { UpdateRoomStatusDto } from './update-room-status.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomStatusWithNoteDto extends UpdateRoomStatusDto {
  @ApiProperty({
    description: 'Ghi chú về việc thay đổi trạng thái',
    example: 'Dọn dẹp sau khi khách check-out',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
