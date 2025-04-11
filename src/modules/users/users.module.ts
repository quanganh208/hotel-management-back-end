import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/modules/users/schemas/user.schema';
import { UsersService } from '@/modules/users/users.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmployeesController } from './employees.controller';
import { HelpersModule } from '@/helpers/helpers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    HelpersModule,
  ],
  controllers: [EmployeesController],
  providers: [UsersService, MailerModule],
  exports: [UsersService, MailerModule],
})
export class UsersModule {}
