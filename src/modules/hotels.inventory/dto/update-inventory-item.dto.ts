import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { InventoryItemType } from '../schemas/inventory-item.schema';
import mongoose from 'mongoose';

export class UpdateInventoryItemDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
    required: true,
  })
  @IsMongoId()
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Mã hàng hóa',
    example: 'SP00001',
    required: false,
  })
  @IsOptional()
  @IsString()
  inventoryCode?: string;

  @ApiProperty({
    description: 'Tên hàng hóa',
    example: 'Nước suối',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Đơn vị',
    example: 'chai',
    required: false,
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    description: 'Giá bán',
    example: 15000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  sellingPrice?: number;

  @ApiProperty({
    description: 'Giá vốn',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  costPrice?: number;

  @ApiProperty({
    description: 'Số lượng tồn kho',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  stock?: number;

  @ApiProperty({
    description: 'Loại hàng hóa',
    enum: InventoryItemType,
    example: InventoryItemType.BEVERAGE,
    required: false,
  })
  @IsOptional()
  @IsEnum(InventoryItemType)
  itemType?: InventoryItemType;

  @ApiProperty({
    description: 'Mô tả hàng hóa',
    example: 'Nước suối tinh khiết 500ml',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Đường dẫn hình ảnh',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
