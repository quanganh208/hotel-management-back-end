import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import mongoose from 'mongoose';
import { InvoiceType } from '../schemas/invoice.schema';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Loại hóa đơn (phòng hoặc dịch vụ lẻ)',
    example: 'room',
    enum: InvoiceType,
  })
  @IsNotEmpty()
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiProperty({
    description: 'ID của phòng (optional cho hóa đơn dịch vụ lẻ)',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  roomId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'ID của đặt phòng (optional)',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  bookingId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Địa chỉ khách hàng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Khách hàng VIP',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Ngày check-in (cho hóa đơn phòng)',
    example: '2023-01-01T14:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  checkInDate?: string;

  @ApiProperty({
    description: 'Ngày check-out (cho hóa đơn phòng)',
    example: '2023-01-03T12:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  checkOutDate?: string;

  @ApiProperty({
    description: 'Giảm giá (nếu có)',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
