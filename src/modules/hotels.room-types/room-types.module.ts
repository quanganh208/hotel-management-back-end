import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesService } from './room-types.service';
import { RoomType, RoomTypeSchema } from './schemas/room-type.schema';
import { HelpersModule } from '@/helpers/helpers.module';
import { HotelsService } from '../hotels/hotels.service';
import { Hotel, HotelSchema } from '../hotels/schemas/hotel.schema';
import { User, UserSchema } from '@/modules/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomType.name, schema: RoomTypeSchema },
      { name: Hotel.name, schema: HotelSchema },
      { name: User.name, schema: UserSchema },
    ]),
    HelpersModule,
  ],
  controllers: [RoomTypesController],
  providers: [RoomTypesService, HotelsService],
  exports: [RoomTypesService],
})
export class RoomTypesModule {}
