// filepath: /Volumes/QuangAnh1TB/Coding/LTW/back-end/src/modules/hotels.inventory/dto/create-inventory-check.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';
import { CreateInventoryCheckItemDto } from './create-inventory-check-item.dto';

export class CreateInventoryCheckDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Kiểm kê hàng hóa định kỳ cuối tháng',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Danh sách mặt hàng kiểm kê',
    type: [CreateInventoryCheckItemDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryCheckItemDto)
  items: CreateInventoryCheckItemDto[];
}
