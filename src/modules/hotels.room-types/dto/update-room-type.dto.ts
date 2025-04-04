import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateRoomTypeDto {
  @ApiProperty({
    description: 'Tên hạng phòng',
    example: 'Deluxe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Giá theo giờ',
    example: 200000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  pricePerHour?: number;

  @ApiProperty({
    description: 'Giá theo ngày',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  pricePerDay?: number;

  @ApiProperty({
    description: 'Giá qua đêm',
    example: 800000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  priceOvernight?: number;

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
