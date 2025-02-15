import { Injectable } from '@nestjs/common';
import { CreateRoomStatusDto } from './dto/create-room.status.dto';
import { UpdateRoomStatusDto } from './dto/update-room.status.dto';

@Injectable()
export class RoomStatusesService {
  create(createRoomStatusDto: CreateRoomStatusDto) {
    return 'This action adds a new roomStatus';
  }

  findAll() {
    return `This action returns all roomStatuses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roomStatus`;
  }

  update(id: number, updateRoomStatusDto: UpdateRoomStatusDto) {
    return `This action updates a #${id} roomStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} roomStatus`;
  }
}
