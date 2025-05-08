import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchBookingDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm (tên khách, số điện thoại)',
    example: 'Nguyễn Văn A hoặc 0123456789',
  })
  @IsNotEmpty()
  @IsString()
  search: string;
}
