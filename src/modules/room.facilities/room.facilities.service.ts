import { Injectable } from '@nestjs/common';
import { CreateRoomFacilityDto } from './dto/create-room.facility.dto';
import { UpdateRoomFacilityDto } from './dto/update-room.facility.dto';

@Injectable()
export class RoomFacilitiesService {
  create(createRoomFacilityDto: CreateRoomFacilityDto) {
    return 'This action adds a new roomFacility';
  }

  findAll() {
    return `This action returns all roomFacilities`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roomFacility`;
  }

  update(id: number, updateRoomFacilityDto: UpdateRoomFacilityDto) {
    return `This action updates a #${id} roomFacility`;
  }

  remove(id: number) {
    return `This action removes a #${id} roomFacility`;
  }
}
