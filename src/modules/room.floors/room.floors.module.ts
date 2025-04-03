import { Module } from '@nestjs/common';
import { RoomFloorsService } from './room.floors.service';
import { RoomFloorsController } from './room.floors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoomFloor,
  RoomFloorSchema,
} from '@/modules/room.floors/schemas/room.floor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomFloor.name, schema: RoomFloorSchema },
    ]),
  ],
  controllers: [RoomFloorsController],
  providers: [RoomFloorsService],
})
export class RoomFloorsModule {}
