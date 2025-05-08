import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomsModule } from '../hotels.rooms/rooms.module';
import { RoomTypesModule } from '../hotels.room-types/room-types.module';
import { BookingsModule } from '../hotels.bookings/bookings.module';
import { ConfigModule } from '@nestjs/config';
import { InventoryModule } from '../hotels.inventory/inventory.module';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Hotel, HotelSchema } from '../hotels/schemas/hotel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: User.name, schema: UserSchema },
      { name: Hotel.name, schema: HotelSchema },
    ]),
    ConfigModule.forRoot(),
    HotelsModule,
    RoomsModule,
    RoomTypesModule,
    BookingsModule,
    InventoryModule,
    UsersModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
