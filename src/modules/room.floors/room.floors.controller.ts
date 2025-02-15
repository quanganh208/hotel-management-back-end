import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoomFloorsService } from './room.floors.service';
import { CreateRoomFloorDto } from './dto/create-room.floor.dto';
import { UpdateRoomFloorDto } from './dto/update-room.floor.dto';

@Controller('room.floors')
export class RoomFloorsController {
  constructor(private readonly roomFloorsService: RoomFloorsService) {}

  @Post()
  create(@Body() createRoomFloorDto: CreateRoomFloorDto) {
    return this.roomFloorsService.create(createRoomFloorDto);
  }

  @Get()
  findAll() {
    return this.roomFloorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomFloorsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoomFloorDto: UpdateRoomFloorDto,
  ) {
    return this.roomFloorsService.update(+id, updateRoomFloorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomFloorsService.remove(+id);
  }
}
