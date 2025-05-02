import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';
import { UpdateInventoryCheckItemDto } from './update-inventory-check-item.dto';
import { InventoryCheckStatus } from '../schemas/inventory-check.schema';

export class UpdateInventoryCheckDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
    required: true,
  })
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
    description: 'Trạng thái phiếu',
    enum: InventoryCheckStatus,
    example: InventoryCheckStatus.BALANCED,
    required: false,
  })
  @IsOptional()
  @IsEnum(InventoryCheckStatus)
  status?: InventoryCheckStatus;

  @ApiProperty({
    description: 'Danh sách mặt hàng kiểm kê',
    type: [UpdateInventoryCheckItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInventoryCheckItemDto)
  items?: UpdateInventoryCheckItemDto[];
}
