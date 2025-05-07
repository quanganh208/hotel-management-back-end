import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { Hotel, HotelSchema } from './schemas/hotel.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { HelpersModule } from '@/helpers/helpers.module';
import { RoomTypesModule } from '../hotels.room-types/room-types.module';
import { RoomsModule } from '../hotels.rooms/rooms.module';
import { BookingsModule } from '../hotels.bookings/bookings.module';
import {
  RoomStatusLog,
  RoomStatusLogSchema,
} from '../hotels.rooms/schemas/room-status-log.schema';
import { RoomStatusLogsService } from '../hotels.rooms/room-status-logs.service';
import { InventoryModule } from '../hotels.inventory/inventory.module';
import { InvoicesModule } from '../hotels.invoices/invoices.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: User.name, schema: UserSchema },
      { name: RoomStatusLog.name, schema: RoomStatusLogSchema },
    ]),
    HelpersModule,
    RoomTypesModule,
    forwardRef(() => RoomsModule),
    BookingsModule,
    InventoryModule,
    InvoicesModule,
  ],
  controllers: [HotelsController],
  providers: [HotelsService, RoomStatusLogsService],
  exports: [HotelsService],
})
export class HotelsModule {}
