import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomFacilitiesService } from './room.facilities.service';
import { CreateRoomFacilityDto } from './dto/create-room.facility.dto';
import { UpdateRoomFacilityDto } from './dto/update-room.facility.dto';

@Controller('room.facilities')
export class RoomFacilitiesController {
  constructor(private readonly roomFacilitiesService: RoomFacilitiesService) {}

  @Post()
  create(@Body() createRoomFacilityDto: CreateRoomFacilityDto) {
    return this.roomFacilitiesService.create(createRoomFacilityDto);
  }

  @Get()
  findAll() {
    return this.roomFacilitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomFacilitiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomFacilityDto: UpdateRoomFacilityDto) {
    return this.roomFacilitiesService.update(+id, updateRoomFacilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomFacilitiesService.remove(+id);
  }
}
