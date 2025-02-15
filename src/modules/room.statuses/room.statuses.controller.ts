import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoomStatusesService } from './room.statuses.service';
import { CreateRoomStatusDto } from './dto/create-room.status.dto';
import { UpdateRoomStatusDto } from './dto/update-room.status.dto';

@Controller('room.statuses')
export class RoomStatusesController {
  constructor(private readonly roomStatusesService: RoomStatusesService) {}

  @Post()
  create(@Body() createRoomStatusDto: CreateRoomStatusDto) {
    return this.roomStatusesService.create(createRoomStatusDto);
  }

  @Get()
  findAll() {
    return this.roomStatusesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomStatusesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoomStatusDto: UpdateRoomStatusDto,
  ) {
    return this.roomStatusesService.update(+id, updateRoomStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomStatusesService.remove(+id);
  }
}
