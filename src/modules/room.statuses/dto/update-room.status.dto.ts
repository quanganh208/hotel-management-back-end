import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomStatusDto } from './create-room.status.dto';

export class UpdateRoomStatusDto extends PartialType(CreateRoomStatusDto) {}
