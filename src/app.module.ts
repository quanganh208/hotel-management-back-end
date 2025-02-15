import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@/modules/users/users.module';
import { AppService } from '@/app.service';
import { RoomsModule } from './modules/rooms/rooms.module';
import { RoomBedTypesModule } from './modules/room.bed_types/room.bed_types.module';
import { RoomStatusesModule } from './modules/room.statuses/room.statuses.module';
import { RoomFloorsModule } from './modules/room.floors/room.floors.module';
import { RoomFacilitiesModule } from './modules/room.facilities/room.facilities.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    RoomsModule,
    RoomBedTypesModule,
    RoomStatusesModule,
    RoomFloorsModule,
    RoomFacilitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
