import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomBedTypeDto } from './create-room.bed_type.dto';

export class UpdateRoomBedTypeDto extends PartialType(CreateRoomBedTypeDto) {}
