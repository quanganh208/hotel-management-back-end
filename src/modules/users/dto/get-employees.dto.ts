import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class GetEmployeesDto {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '648d33dca63ee7c0bf8a6f1b',
  })
  @IsNotEmpty({ message: 'ID khách sạn không được để trống' })
  @IsMongoId({ message: 'ID khách sạn không hợp lệ' })
  hotelId: string;
}
