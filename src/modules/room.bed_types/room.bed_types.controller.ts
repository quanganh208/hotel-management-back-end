import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoomBedTypesService } from './room.bed_types.service';
import { CreateRoomBedTypeDto } from './dto/create-room.bed_type.dto';
import { UpdateRoomBedTypeDto } from './dto/update-room.bed_type.dto';

@Controller('room.bed-types')
export class RoomBedTypesController {
  constructor(private readonly roomBedTypesService: RoomBedTypesService) {}

  @Post()
  create(@Body() createRoomBedTypeDto: CreateRoomBedTypeDto) {
    return this.roomBedTypesService.create(createRoomBedTypeDto);
  }

  @Get()
  findAll() {
    return this.roomBedTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomBedTypesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoomBedTypeDto: UpdateRoomBedTypeDto,
  ) {
    return this.roomBedTypesService.update(+id, updateRoomBedTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomBedTypesService.remove(+id);
  }
}
