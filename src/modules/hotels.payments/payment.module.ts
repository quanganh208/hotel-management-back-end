import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { InvoicesModule } from '../hotels.invoices/invoices.module';

@Module({
  imports: [ConfigModule, InvoicesModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
