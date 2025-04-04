import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schemas/room.schema';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { ConfigModule } from '@nestjs/config';
import { HotelsService } from '../hotels/hotels.service';
import { Hotel, HotelSchema } from '../hotels/schemas/hotel.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RoomTypesModule } from '../hotels.room-types/room-types.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Hotel.name, schema: HotelSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConfigModule,
    RoomTypesModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, SupabaseStorageService, HotelsService],
  exports: [RoomsService],
})
export class RoomsModule {}
