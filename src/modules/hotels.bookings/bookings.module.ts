import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Room, RoomSchema } from '../hotels.rooms/schemas/room.schema';
import { RoomsService } from '../hotels.rooms/rooms.service';
import { HotelsService } from '../hotels/hotels.service';
import { Hotel, HotelSchema } from '../hotels/schemas/hotel.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RoomTypesModule } from '../hotels.room-types/room-types.module';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import {
  RoomType,
  RoomTypeSchema,
} from '../hotels.room-types/schemas/room-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Hotel.name, schema: HotelSchema },
      { name: User.name, schema: UserSchema },
      { name: RoomType.name, schema: RoomTypeSchema },
    ]),
    RoomTypesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, RoomsService, HotelsService, RoomTypesService],
  exports: [BookingsService],
})
export class BookingsModule {}
