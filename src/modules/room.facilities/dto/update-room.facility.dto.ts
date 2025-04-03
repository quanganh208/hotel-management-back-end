import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomFacilityDto } from './create-room.facility.dto';

export class UpdateRoomFacilityDto extends PartialType(CreateRoomFacilityDto) {}
