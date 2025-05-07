import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/modules/users/schemas/user.schema';
import { UsersService } from '@/modules/users/users.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmployeesController } from './employees.controller';
import { UsersController } from './users.controller';
import { HelpersModule } from '@/helpers/helpers.module';
import { Hotel, HotelSchema } from '@/modules/hotels/schemas/hotel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Hotel.name, schema: HotelSchema },
    ]),
    HelpersModule,
  ],
  controllers: [EmployeesController, UsersController],
  providers: [UsersService, MailerModule],
  exports: [UsersService, MailerModule],
})
export class UsersModule {}
