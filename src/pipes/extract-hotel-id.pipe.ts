import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ExtractHotelIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // If the value is an object and has a hotelId property
    if (value && typeof value === 'object' && 'hotelId' in value) {
      // Extract hotelId
      const { hotelId, ...rest } = value;

      // Store hotelId in a special property that won't be validated
      (rest as any).__hotelId = hotelId;

      return rest;
    }
    return value;
  }
}
