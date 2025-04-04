import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomTypeDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsMongoId()
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tên hạng phòng',
    example: 'Deluxe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Giá theo giờ',
    example: 200000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  pricePerHour: number;

  @ApiProperty({
    description: 'Giá theo ngày',
    example: 500000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  pricePerDay: number;

  @ApiProperty({
    description: 'Giá qua đêm',
    example: 800000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  priceOvernight: number;

  @ApiProperty({
    description: 'Mô tả hạng phòng',
    example: 'Phòng Deluxe với view đẹp',
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
