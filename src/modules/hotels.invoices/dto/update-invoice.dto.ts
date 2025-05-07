import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import mongoose from 'mongoose';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @ApiProperty({
    description: 'ID của mặt hàng trong kho',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  itemId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Số lượng',
    example: 2,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateInvoiceDto {
  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerName?: string;

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

  @ApiProperty({
    description: 'Danh sách các mặt hàng của hóa đơn',
    type: [InvoiceItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];
}
