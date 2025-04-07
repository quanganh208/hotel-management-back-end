import { RoomsService } from '../hotels.rooms/rooms.service';
import { HotelsService } from '../hotels/hotels.service';
import { RequestWithUser } from '@/types/express';
import { BookingsService } from './bookings.service';
import { Booking } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    private readonly roomsService;
    private readonly hotelsService;
    constructor(bookingsService: BookingsService, roomsService: RoomsService, hotelsService: HotelsService);
    create(createBookingDto: CreateBookingDto, req: RequestWithUser): Promise<Booking>;
    findAll(hotelId: string, req: RequestWithUser): Promise<Booking[]>;
    findByRoomId(roomId: string, req: RequestWithUser): Promise<Booking[]>;
    findOne(id: string, req: RequestWithUser): Promise<Booking>;
    update(id: string, updateBookingDto: UpdateBookingDto, req: RequestWithUser): Promise<Booking>;
    remove(id: string, req: RequestWithUser): Promise<Booking>;
}
