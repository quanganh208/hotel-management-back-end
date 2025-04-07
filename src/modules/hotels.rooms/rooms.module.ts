import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomTypesModule } from '../hotels.room-types/room-types.module';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomStatusLogsService } from './room-status-logs.service';
import { RoomStatusLogsController } from './room-status-logs.controller';
import {
  RoomStatusLog,
  RoomStatusLogSchema,
} from './schemas/room-status-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: RoomStatusLog.name, schema: RoomStatusLogSchema },
    ]),
    RoomTypesModule,
    forwardRef(() => HotelsModule),
  ],
  controllers: [RoomsController, RoomStatusLogsController],
  providers: [RoomsService, SupabaseStorageService, RoomStatusLogsService],
  exports: [RoomsService],
})
export class RoomsModule {}
