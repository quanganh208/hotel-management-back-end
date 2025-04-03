import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomFloorDto } from './create-room.floor.dto';

export class UpdateRoomFloorDto extends PartialType(CreateRoomFloorDto) {}
