import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { HotelsModule } from '../hotels/hotels.module';
import { BookingsModule } from '../hotels.bookings/bookings.module';
import { InvoicesModule } from '../hotels.invoices/invoices.module';
import { RoomsModule } from '../hotels.rooms/rooms.module';
import { InventoryModule } from '../hotels.inventory/inventory.module';

@Module({
  imports: [
    HotelsModule,
    BookingsModule,
    InvoicesModule,
    RoomsModule,
    InventoryModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
