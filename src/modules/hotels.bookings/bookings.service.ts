import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Room, RoomDocument } from '../hotels.rooms/schemas/room.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const booking = new this.bookingModel({
      ...createBookingDto,
      roomId: new Types.ObjectId(createBookingDto.roomId),
      createdBy: new Types.ObjectId(createBookingDto.createdBy),
      checkInDate: new Date(createBookingDto.checkInDate),
      checkOutDate: new Date(createBookingDto.checkOutDate),
    });

    const savedBooking = await booking.save();

    // Cập nhật trạng thái phòng thành booked
    await this.roomModel.findByIdAndUpdate(createBookingDto.roomId, {
      status: 'booked',
      $push: { bookings: savedBooking._id },
    });

    return savedBooking;
  }

  async findByHotelId(hotelId: Types.ObjectId): Promise<Booking[]> {
    // Tìm tất cả các phòng thuộc khách sạn
    const rooms = await this.roomModel.find({ hotelId }).exec();
    const roomIds = rooms.map((room) => room._id);

    // Tìm tất cả các đặt phòng có roomId nằm trong danh sách phòng của khách sạn
    return this.bookingModel
      .find({ roomId: { $in: roomIds } })
      .populate('roomId', 'roomNumber floor')
      .populate('createdBy', 'name email')
      .exec();
  }

  async findByRoomId(roomId: Types.ObjectId): Promise<Booking[]> {
    return this.bookingModel
      .find({ roomId })
      .populate('roomId', 'roomNumber floor')
      .populate('createdBy', 'name email')
      .exec();
  }

  async findLatestByRoomId(roomId: Types.ObjectId): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({ roomId })
      .sort({ createdAt: -1 })
      .populate('roomId', 'roomNumber floor')
      .populate('createdBy', 'name email')
      .exec();

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đặt phòng nào cho phòng này');
    }

    return booking;
  }

  async findOne(id: Types.ObjectId): Promise<Booking> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('roomId', 'roomNumber floor hotelId')
      .populate('createdBy', 'name email')
      .exec();

    if (!booking) {
      throw new NotFoundException('Đặt phòng không tồn tại');
    }

    return booking;
  }

  async update(
    id: Types.ObjectId,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const updates: any = { ...updateBookingDto };

    if (updateBookingDto.checkInDate) {
      updates.checkInDate = new Date(updateBookingDto.checkInDate);
    }

    if (updateBookingDto.checkOutDate) {
      updates.checkOutDate = new Date(updateBookingDto.checkOutDate);
    }

    const updatedBooking = await this.bookingModel
      .findByIdAndUpdate(id, updates, { new: true })
      .populate('roomId', 'roomNumber floor')
      .populate('createdBy', 'name email')
      .exec();

    if (!updatedBooking) {
      throw new NotFoundException('Đặt phòng không tồn tại');
    }

    return updatedBooking;
  }

  async remove(id: Types.ObjectId): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException('Đặt phòng không tồn tại');
    }

    // Lấy thông tin roomId trước khi xóa
    const { roomId } = booking;

    // Xóa booking
    const deletedBooking = await this.bookingModel.findByIdAndDelete(id).exec();

    if (!deletedBooking) {
      throw new NotFoundException('Không thể xóa đặt phòng');
    }

    // Kiểm tra xem còn booking nào cho phòng này không
    const bookingsForRoom = await this.bookingModel.find({ roomId }).exec();

    // Nếu không còn booking nào, cập nhật trạng thái phòng thành available
    if (bookingsForRoom.length === 0) {
      await this.roomModel.findByIdAndUpdate(roomId, {
        status: 'available',
        $pull: { bookings: id },
      });
    } else {
      // Nếu còn booking khác, chỉ xóa booking hiện tại khỏi mảng bookings của phòng
      await this.roomModel.findByIdAndUpdate(roomId, {
        $pull: { bookings: id },
      });
    }

    return deletedBooking;
  }
}
