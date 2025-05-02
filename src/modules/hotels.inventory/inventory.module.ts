import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import {
  InventoryItem,
  InventoryItemSchema,
} from './schemas/inventory-item.schema';
import { HelpersModule } from '@/helpers/helpers.module';
import { HotelsModule } from '../hotels/hotels.module';
import { InventoryCheckController } from './inventory-check.controller';
import { InventoryCheckService } from './inventory-check.service';
import {
  InventoryCheck,
  InventoryCheckSchema,
} from './schemas/inventory-check.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: InventoryCheck.name, schema: InventoryCheckSchema },
    ]),
    HelpersModule,
    forwardRef(() => HotelsModule),
  ],
  controllers: [InventoryController, InventoryCheckController],
  providers: [InventoryService, InventoryCheckService],
  exports: [InventoryService, InventoryCheckService],
})
export class InventoryModule {}
