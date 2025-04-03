import { Module } from '@nestjs/common';
import { RoomStatusesService } from './room.statuses.service';
import { RoomStatusesController } from './room.statuses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoomStatus,
  RoomStatusSchema,
} from '@/modules/room.statuses/schemas/room.status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomStatus.name, schema: RoomStatusSchema },
    ]),
  ],
  controllers: [RoomStatusesController],
  providers: [RoomStatusesService],
})
export class RoomStatusesModule {}
