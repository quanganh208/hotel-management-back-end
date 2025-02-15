import { Injectable } from '@nestjs/common';
import { CreateRoomBedTypeDto } from './dto/create-room.bed_type.dto';
import { UpdateRoomBedTypeDto } from './dto/update-room.bed_type.dto';

@Injectable()
export class RoomBedTypesService {
  create(createRoomBedTypeDto: CreateRoomBedTypeDto) {
    return 'This action adds a new roomBedType';
  }

  findAll() {
    return `This action returns all roomBedTypes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roomBedType`;
  }

  update(id: number, updateRoomBedTypeDto: UpdateRoomBedTypeDto) {
    return `This action updates a #${id} roomBedType`;
  }

  remove(id: number) {
    return `This action removes a #${id} roomBedType`;
  }
}
