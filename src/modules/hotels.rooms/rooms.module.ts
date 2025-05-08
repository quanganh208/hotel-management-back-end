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
import { BookingsModule } from '../hotels.bookings/bookings.module';
import { InvoicesModule } from '../hotels.invoices/invoices.module';
import {
  Invoice,
  InvoiceSchema,
} from '../hotels.invoices/schemas/invoice.schema';
import { PaymentModule } from '../hotels.payments/payment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: RoomStatusLog.name, schema: RoomStatusLogSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    RoomTypesModule,
    forwardRef(() => HotelsModule),
    forwardRef(() => BookingsModule),
    forwardRef(() => InvoicesModule),
    PaymentModule,
  ],
  controllers: [RoomsController, RoomStatusLogsController],
  providers: [RoomsService, SupabaseStorageService, RoomStatusLogsService],
  exports: [RoomsService, RoomStatusLogsService],
})
export class RoomsModule {}
