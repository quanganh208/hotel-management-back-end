import { Module } from '@nestjs/common';
import { RoomBedTypesService } from './room.bed_types.service';
import { RoomBedTypesController } from './room.bed_types.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoomBedType,
  RoomBedTypeSchema,
} from '@/modules/room.bed_types/schemas/room.bed_type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomBedType.name, schema: RoomBedTypeSchema },
    ]),
  ],
  controllers: [RoomBedTypesController],
  providers: [RoomBedTypesService],
})
export class RoomBedTypesModule {}
