import { Module } from '@nestjs/common';
import { RoomFacilitiesService } from './room.facilities.service';
import { RoomFacilitiesController } from './room.facilities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoomFacility,
  RoomFacilitySchema,
} from '@/modules/room.facilities/schemas/room.facility.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomFacility.name, schema: RoomFacilitySchema },
    ]),
  ],
  controllers: [RoomFacilitiesController],
  providers: [RoomFacilitiesService],
})
export class RoomFacilitiesModule {}
