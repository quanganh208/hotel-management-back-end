import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { Hotel, HotelSchema } from './schemas/hotel.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { HelpersModule } from '@/helpers/helpers.module';
import { RoomTypesModule } from '../hotels.room-types/room-types.module';
import { RoomsModule } from '../hotels.rooms/rooms.module';
import { BookingsModule } from '../hotels.bookings/bookings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: User.name, schema: UserSchema },
    ]),
    HelpersModule,
    RoomTypesModule,
    RoomsModule,
    BookingsModule,
  ],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
