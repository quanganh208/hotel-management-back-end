import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@/modules/users/users.module';
import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { HotelsModule } from '@/modules/hotels/hotels.module';
import { HelpersModule } from '@/helpers/helpers.module';
import { PaymentModule } from './modules/hotels.payments/payment.module';

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
    AuthModule,
    HotelsModule,
    HelpersModule,
    PaymentModule,
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
