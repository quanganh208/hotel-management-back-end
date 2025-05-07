import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { HotelsModule } from '../hotels/hotels.module';
import { InventoryModule } from '../hotels.inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    forwardRef(() => HotelsModule),
    forwardRef(() => InventoryModule),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
