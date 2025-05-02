import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateInventoryCheckItemDto {
  @ApiProperty({
    description: 'ID của mặt hàng (tùy chọn)',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  inventoryItemId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Mã hàng hóa',
    example: 'SP00001',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  inventoryCode: string;

  @ApiProperty({
    description: 'Tên hàng hóa (tùy chọn)',
    example: 'Nước suối',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Đơn vị (tùy chọn)',
    example: 'chai',
    required: false,
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    description: 'Số lượng trong hệ thống (tùy chọn)',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  systemStock?: number;

  @ApiProperty({
    description: 'Số lượng thực tế',
    example: 95,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  actualStock: number;

  @ApiProperty({
    description: 'Chênh lệch (tùy chọn)',
    example: -5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  difference?: number;
}
