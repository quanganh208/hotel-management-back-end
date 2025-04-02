import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({ description: 'Tên khách sạn' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Địa chỉ khách sạn' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh khách sạn' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Danh sách ID nhân viên' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  staff?: string[];
}
