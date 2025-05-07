import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckPaymentDto {
  @ApiProperty({
    description: 'Mã giao dịch cần kiểm tra',
    example: 'PAY1AB2CD3EF',
  })
  @IsNotEmpty()
  @IsString()
  transactionCode: string;

  @ApiProperty({
    description: 'Số tiền cần kiểm tra',
    example: 1500000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'ID của hóa đơn',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  invoiceId: string;
}
