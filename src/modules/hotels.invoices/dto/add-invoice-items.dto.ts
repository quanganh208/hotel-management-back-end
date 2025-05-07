import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';
import { Type } from 'class-transformer';

// DTO đơn giản hóa cho việc thêm mặt hàng vào hóa đơn
export class AddInvoiceItemDto {
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

export class AddInvoiceItemsDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Danh sách mặt hàng cần thêm vào hóa đơn',
    type: [AddInvoiceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddInvoiceItemDto)
  items: AddInvoiceItemDto[];
}
