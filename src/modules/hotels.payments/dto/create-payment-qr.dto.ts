import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreatePaymentQrDto {
  @ApiProperty({
    description: 'ID của hóa đơn cần thanh toán',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  invoiceId: string;
}
