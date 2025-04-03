import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@/modules/users/users.module';
import { AppService } from '@/app.service';
import { RoomsModule } from '@/modules/rooms/rooms.module';
import { RoomBedTypesModule } from '@/modules/room.bed_types/room.bed_types.module';
import { RoomStatusesModule } from '@/modules/room.statuses/room.statuses.module';
import { RoomFloorsModule } from '@/modules/room.floors/room.floors.module';
import { RoomFacilitiesModule } from '@/modules/room.facilities/room.facilities.module';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

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
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
