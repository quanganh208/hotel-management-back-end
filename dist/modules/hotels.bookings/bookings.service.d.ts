import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { RoomDocument } from '../hotels.rooms/schemas/room.schema';
export declare class BookingsService {
    private bookingModel;
    private roomModel;
    constructor(bookingModel: Model<BookingDocument>, roomModel: Model<RoomDocument>);
    create(createBookingDto: CreateBookingDto): Promise<Booking>;
    findByHotelId(hotelId: Types.ObjectId): Promise<Booking[]>;
    findByRoomId(roomId: Types.ObjectId): Promise<Booking[]>;
    findOne(id: Types.ObjectId): Promise<Booking>;
    update(id: Types.ObjectId, updateBookingDto: UpdateBookingDto): Promise<Booking>;
    remove(id: Types.ObjectId): Promise<Booking>;
}
