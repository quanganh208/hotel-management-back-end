import { Injectable } from '@nestjs/common';
import { CreateRoomFloorDto } from './dto/create-room.floor.dto';
import { UpdateRoomFloorDto } from './dto/update-room.floor.dto';

@Injectable()
export class RoomFloorsService {
  create(createRoomFloorDto: CreateRoomFloorDto) {
    return 'This action adds a new roomFloor';
  }

  findAll() {
    return `This action returns all roomFloors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roomFloor`;
  }

  update(id: number, updateRoomFloorDto: UpdateRoomFloorDto) {
    return `This action updates a #${id} roomFloor`;
  }

  remove(id: number) {
    return `This action removes a #${id} roomFloor`;
  }
}
