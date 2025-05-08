import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import mongoose from 'mongoose';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatusLogsService } from './room-status-logs.service';
import { CreateRoomStatusLogDto } from './dto/create-room-status-log.dto';
import { UpdateRoomStatusWithNoteDto } from './dto/update-room-status-with-note.dto';
import { BookingsService } from '../hotels.bookings/bookings.service';
import { WalkInCheckInDto } from './dto/walk-in-check-in.dto';
import { Booking } from '../hotels.bookings/schemas/booking.schema';
import { CheckInRoomDto } from './dto/check-in-room.dto';
import { InvoicesService } from '../hotels.invoices/invoices.service';
import { InvoiceType } from '../hotels.invoices/schemas/invoice.schema';
import {
  Invoice,
  InvoiceDocument,
} from '../hotels.invoices/schemas/invoice.schema';
import { ItemType } from '../hotels.invoices/schemas/invoice.schema';
import { BookingStatus } from '../hotels.bookings/schemas/booking.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly roomTypesService: RoomTypesService,
    private readonly roomStatusLogsService: RoomStatusLogsService,
    private readonly bookingsService: BookingsService,
    private readonly invoicesService: InvoicesService,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Kiểm tra xem roomType có tồn tại không
    await this.roomTypesService.findOne(createRoomDto.roomTypeId);

    const newRoom = new this.roomModel(createRoomDto);
    const savedRoom = await newRoom.save();

    // Thêm room vào roomType
    await this.roomTypesService.addRoomToRoomType(
      createRoomDto.roomTypeId,
      savedRoom._id,
    );

    return savedRoom;
  }

  async findAll(hotelId: mongoose.Types.ObjectId): Promise<Room[]> {
    return this.roomModel.find({ hotelId }).populate('roomTypeId').exec();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<Room> {
    const room = await this.roomModel
      .findById(id)
      .populate('roomTypeId')
      .exec();
    if (!room) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }
    return room;
  }

  async findByHotelId(hotelId: mongoose.Types.ObjectId): Promise<Room[]> {
    return this.roomModel.find({ hotelId }).populate('roomTypeId').exec();
  }

  async findByRoomTypeId(roomTypeId: mongoose.Types.ObjectId): Promise<Room[]> {
    return this.roomModel.find({ roomTypeId }).populate('roomTypeId').exec();
  }

  async update(
    id: mongoose.Types.ObjectId,
    updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    // Nếu đang thay đổi roomTypeId, cần kiểm tra roomTypeId mới có tồn tại không
    if (updateRoomDto.roomTypeId) {
      await this.roomTypesService.findOne(updateRoomDto.roomTypeId);
    }

    const existingRoom = await this.findOne(id);
    const oldRoomTypeId =
      existingRoom.roomTypeId as unknown as mongoose.Types.ObjectId;

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { $set: updateRoomDto }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Nếu đã thay đổi roomTypeId
    if (
      updateRoomDto.roomTypeId &&
      oldRoomTypeId.toString() !== updateRoomDto.roomTypeId.toString()
    ) {
      // Xóa room khỏi roomType cũ
      await this.roomTypesService.removeRoomFromRoomType(oldRoomTypeId, id);

      // Thêm room vào roomType mới
      await this.roomTypesService.addRoomToRoomType(
        updateRoomDto.roomTypeId,
        id,
      );
    }

    return updatedRoom;
  }

  async updateStatus(
    id: mongoose.Types.ObjectId,
    updateStatusDto: UpdateRoomStatusWithNoteDto,
    userId: string,
  ): Promise<Room> {
    // Lấy thông tin phòng hiện tại để ghi log trạng thái trước đó
    const currentRoom = await this.findOne(id);
    const previousStatus = currentRoom.status;

    // Cập nhật trạng thái mới
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { status: updateStatusDto.status }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Lưu log thay đổi trạng thái
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const logDto: CreateRoomStatusLogDto = {
      roomId: id,
      status: updateStatusDto.status,
      previousStatus: previousStatus as RoomStatus,
      changedBy: userIdObj,
      note: updateStatusDto.note,
    };

    await this.roomStatusLogsService.create(logDto);

    return updatedRoom;
  }

  async checkInRoom(
    id: mongoose.Types.ObjectId,
    checkInDto: CheckInRoomDto,
    userId: string,
  ): Promise<Room> {
    // Get current room information to log previous status
    const currentRoom = await this.findOne(id);
    const previousStatus = currentRoom.status;

    // Update room status to CHECKED_IN
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { status: RoomStatus.CHECKED_IN }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Create log for status change
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const logDto: CreateRoomStatusLogDto = {
      roomId: id,
      status: RoomStatus.CHECKED_IN,
      previousStatus: previousStatus as RoomStatus,
      changedBy: userIdObj,
      note: checkInDto.note || 'Khách đã nhận phòng',
    };

    await this.roomStatusLogsService.create(logDto);

    // Create an invoice for the check-in
    let guestName = 'Khách lẻ';
    let phoneNumber = '';
    let checkInDate = new Date();
    let checkOutDate: Date | undefined;
    let bookingId: mongoose.Types.ObjectId | undefined;

    // If there's a booking, get guest info from it and update booking status
    if (checkInDto.bookingId) {
      try {
        const bookingObjectId = new mongoose.Types.ObjectId(
          checkInDto.bookingId,
        );
        const booking = await this.bookingsService.findOne(bookingObjectId);
        if (booking) {
          guestName = booking.guestName;
          phoneNumber = booking.phoneNumber || '';
          checkInDate = booking.checkInDate;
          checkOutDate = booking.checkOutDate;
          bookingId = bookingObjectId;

          // Cập nhật trạng thái booking thành CHECKED_IN
          await this.bookingsService.update(bookingObjectId, {
            status: BookingStatus.CHECKED_IN,
          });
        }
      } catch (error) {
        console.error('Error fetching booking for invoice creation:', error);
      }
    }

    // Create a new invoice for this check-in
    const invoice = await this.invoicesService.create(
      {
        hotelId: updatedRoom.hotelId,
        invoiceType: InvoiceType.ROOM,
        roomId: id,
        bookingId,
        customerName: guestName,
        customerPhone: phoneNumber,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate ? checkOutDate.toISOString() : undefined,
        note: 'Hóa đơn tạo tự động khi khách check-in',
      },
      userId,
    );

    // Thêm chi phí thuê phòng vào hóa đơn
    try {
      const roomType = updatedRoom.roomTypeId as any;
      if (roomType) {
        // Tính tiền phòng dựa vào loại phòng và thời gian check-in/check-out
        const roomTypeId = new mongoose.Types.ObjectId(roomType._id);
        const roomTypeName = roomType.name || 'Phòng tiêu chuẩn';

        // Tính giá phòng dựa trên thời gian check-in và check-out
        const priceInfo = this.calculateRoomPrice(
          roomType,
          checkInDate,
          checkOutDate,
        );

        // Chuẩn bị thông tin chi tiết về mục hóa đơn
        let itemName = `Tiền thuê phòng - ${roomTypeName}`;
        let quantity = 1;
        let note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName}`;
        let price = roomType.pricePerDay;

        // Điều chỉnh tên mục và ghi chú dựa vào loại tính phí
        if (priceInfo.type === 'hour') {
          itemName = `Tiền thuê phòng theo giờ - ${roomTypeName}`;
          quantity = priceInfo.hours || 1;
          note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName} (${priceInfo.hours} giờ)`;
          price = roomType.pricePerHour;
        } else if (priceInfo.type === 'day') {
          itemName = `Tiền thuê phòng theo ngày - ${roomTypeName}`;
          quantity = priceInfo.days || 1;
          note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName} (${priceInfo.days} ngày)`;
          price = roomType.pricePerDay;
        } else if (priceInfo.type === 'overnight') {
          itemName = `Tiền thuê phòng qua đêm - ${roomTypeName}`;
          note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName} (Qua đêm)`;
          price = roomType.pricePerOvernight;
        }

        // Cập nhật hóa đơn với chi phí thuê phòng
        const updatedInvoice = await this.invoiceModel.findByIdAndUpdate(
          invoice['_id'],
          {
            $push: {
              items: {
                itemId: roomTypeId,
                name: itemName,
                type: 'service',
                itemType: ItemType.ROOM,
                quantity: quantity,
                price: price,
                amount: price * quantity,
                note: note,
              },
            },
            $inc: {
              totalAmount: price * quantity,
              finalAmount: price * quantity,
            },
          },
          { new: true },
        );

        if (!updatedInvoice) {
          throw new Error('Không thể cập nhật hóa đơn với chi phí thuê phòng');
        }
      }
    } catch (error) {
      console.error('Error adding room cost to invoice:', error);
    }

    return updatedRoom;
  }

  async walkInCheckIn(
    id: mongoose.Types.ObjectId,
    walkInDto: WalkInCheckInDto,
    userId: string,
  ): Promise<{ room: Room; booking: Booking }> {
    // Get current room information
    const currentRoom = await this.findOne(id);

    // Check if room is available
    if (currentRoom.status !== RoomStatus.AVAILABLE) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không khả dụng để nhận khách vãng lai`,
      );
    }

    // Create booking for the walk-in guest
    const checkInDate = walkInDto.checkInDate
      ? new Date(walkInDto.checkInDate)
      : new Date();

    const createBookingDto = {
      roomId: id.toString(),
      checkInDate: checkInDate.toISOString(),
      checkOutDate: walkInDto.checkOutDate,
      guestName: walkInDto.guestName,
      phoneNumber: walkInDto.phoneNumber,
      guestCount: walkInDto.guestCount,
      note: walkInDto.note
        ? `Khách vãng lai: ${walkInDto.note}`
        : 'Khách vãng lai nhận phòng trực tiếp',
      createdBy: userId,
      status: BookingStatus.CHECKED_IN, // Đặt trạng thái là CHECKED_IN ngay khi tạo booking cho khách vãng lai
    };

    // Create the booking
    const booking = await this.bookingsService.create(createBookingDto);

    // Update room status to CHECKED_IN
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { status: RoomStatus.CHECKED_IN }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Log the status change
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const logDto: CreateRoomStatusLogDto = {
      roomId: id,
      status: RoomStatus.CHECKED_IN,
      previousStatus: currentRoom.status as RoomStatus,
      changedBy: userIdObj,
      note: `Khách vãng lai ${walkInDto.guestName} nhận phòng trực tiếp. SĐT: ${walkInDto.phoneNumber}`,
    };

    await this.roomStatusLogsService.create(logDto);

    // Create a new invoice for this walk-in
    // We need to safely access the booking ID
    const bookingObjectId: mongoose.Types.ObjectId | undefined =
      mongoose.Types.ObjectId.isValid(booking['_id']?.toString())
        ? new mongoose.Types.ObjectId(booking['_id'].toString())
        : undefined;

    const invoice = await this.invoicesService.create(
      {
        hotelId: updatedRoom.hotelId,
        invoiceType: InvoiceType.ROOM,
        roomId: id,
        bookingId: bookingObjectId,
        customerName: walkInDto.guestName,
        customerPhone: walkInDto.phoneNumber,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: walkInDto.checkOutDate,
        note: 'Hóa đơn tạo tự động khi khách vãng lai check-in',
      },
      userId,
    );

    // Thêm chi phí thuê phòng vào hóa đơn
    try {
      const roomType = updatedRoom.roomTypeId as any;
      if (roomType) {
        // Tính tiền phòng dựa vào loại phòng và thời gian check-in/check-out
        const roomTypeId = new mongoose.Types.ObjectId(roomType._id);
        const roomTypeName = roomType.name || 'Phòng tiêu chuẩn';

        // Xác định check-out date nếu có
        const checkOutDate = walkInDto.checkOutDate
          ? new Date(walkInDto.checkOutDate)
          : undefined;

        // Tính giá phòng dựa trên thời gian check-in và check-out
        const priceInfo = this.calculateRoomPrice(
          roomType,
          checkInDate,
          checkOutDate,
        );

        // Chuẩn bị thông tin chi tiết về mục hóa đơn
        let itemName = `Tiền thuê phòng - ${roomTypeName}`;
        let quantity = 1;
        let note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName}`;
        let price = roomType.pricePerDay;

        // Điều chỉnh tên mục và ghi chú dựa vào loại tính phí
        if (priceInfo.type === 'hour') {
          itemName = `Tiền thuê phòng theo giờ - ${roomTypeName}`;
          quantity = priceInfo.hours || 1;
          note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName} (${priceInfo.hours} giờ)`;
          price = roomType.pricePerHour;
        } else if (priceInfo.type === 'day') {
          itemName = `Tiền thuê phòng theo ngày - ${roomTypeName}`;
          quantity = priceInfo.days || 1;
          note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName} (${priceInfo.days} ngày)`;
          price = roomType.pricePerDay;
        } else if (priceInfo.type === 'overnight') {
          itemName = `Tiền thuê phòng qua đêm - ${roomTypeName}`;
          note = `Phòng ${updatedRoom.roomNumber} - ${roomTypeName} (Qua đêm)`;
          price = roomType.pricePerOvernight;
        }

        // Cập nhật hóa đơn với chi phí thuê phòng
        const updatedInvoice = await this.invoiceModel.findByIdAndUpdate(
          invoice['_id'],
          {
            $push: {
              items: {
                itemId: roomTypeId,
                name: itemName,
                type: 'service',
                itemType: ItemType.ROOM,
                quantity: quantity,
                price: price,
                amount: price * quantity,
                note: note,
              },
            },
            $inc: {
              totalAmount: price * quantity,
              finalAmount: price * quantity,
            },
          },
          { new: true },
        );

        if (!updatedInvoice) {
          throw new Error('Không thể cập nhật hóa đơn với chi phí thuê phòng');
        }
      }
    } catch (error) {
      console.error('Error adding room cost to invoice:', error);
    }

    return { room: updatedRoom, booking };
  }

  async checkOutRoom(
    id: mongoose.Types.ObjectId,
    paymentMethod: string,
    userId: string,
  ): Promise<Room> {
    // Get current room information
    const currentRoom = await this.findOne(id);

    // Check if room is in CHECKED_IN status
    if (currentRoom.status !== RoomStatus.CHECKED_IN) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không ở trạng thái đang sử dụng (checked in)`,
      );
    }

    // Update room status to AVAILABLE
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { status: RoomStatus.AVAILABLE }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Log the status change
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const logDto: CreateRoomStatusLogDto = {
      roomId: id,
      status: RoomStatus.AVAILABLE,
      previousStatus: currentRoom.status as RoomStatus,
      changedBy: userIdObj,
      note: 'Khách trả phòng',
    };

    await this.roomStatusLogsService.create(logDto);

    // Find the active invoice for this room and check it out
    try {
      const invoice = await this.invoicesService.findActiveRoomInvoice(id);
      if (invoice) {
        // Use bracket notation to access _id since it might not be in the type definition
        // but is added by MongoDB at runtime
        const invoiceId = mongoose.Types.ObjectId.isValid(
          invoice['_id']?.toString(),
        )
          ? new mongoose.Types.ObjectId(invoice['_id'].toString())
          : undefined;

        if (invoiceId) {
          await this.invoicesService.checkout(invoiceId, paymentMethod, userId);
        }

        // Nếu có booking liên quan, cập nhật trạng thái booking thành CHECKED_OUT
        if (invoice.bookingId) {
          const bookingId = new mongoose.Types.ObjectId(
            invoice.bookingId.toString(),
          );
          await this.bookingsService.update(bookingId, {
            status: BookingStatus.CHECKED_OUT,
          });
        }
      }
    } catch (error) {
      console.error('Error processing invoice checkout:', error);
      // We don't want the checkout to fail if the invoice processing fails
      // Just log the error and continue
    }

    return updatedRoom;
  }

  async remove(id: mongoose.Types.ObjectId): Promise<Room> {
    const room = await this.findOne(id);

    // Xóa room khỏi roomType
    await this.roomTypesService.removeRoomFromRoomType(
      room.roomTypeId as unknown as mongoose.Types.ObjectId,
      id,
    );

    const deletedRoom = await this.roomModel.findByIdAndDelete(id);
    if (!deletedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }
    return deletedRoom;
  }

  /**
   * Tính tiền phòng dựa trên loại phòng và thời gian check-in/check-out
   * @param roomType Loại phòng
   * @param checkInDate Thời gian check-in
   * @param checkOutDate Thời gian check-out (không bắt buộc, mặc định là thời gian hiện tại)
   * @returns {price: number, type: string, hours: number} Giá tiền và loại tính phí (hour/day/overnight)
   */
  private calculateRoomPrice(
    roomType: any,
    checkInDate: Date,
    checkOutDate?: Date,
  ): { price: number; type: string; hours?: number; days?: number } {
    // Nếu không có checkOutDate, lấy thời gian hiện tại
    const actualCheckOutDate = checkOutDate || new Date();

    // Tính thời gian sử dụng phòng (milliseconds)
    const usageDuration = actualCheckOutDate.getTime() - checkInDate.getTime();

    // Chuyển đổi sang giờ và làm tròn lên (ví dụ: 4.2 giờ -> 5 giờ)
    const hoursUsed = Math.ceil(usageDuration / (1000 * 60 * 60));

    // Xác định checkInHour và checkOutHour (giờ trong ngày)
    const checkInHour = checkInDate.getHours() + checkInDate.getMinutes() / 60;
    const checkOutHour =
      actualCheckOutDate.getHours() + actualCheckOutDate.getMinutes() / 60;

    // Tính số ngày giữa hai ngày (không tính giờ)
    const daysBetween = Math.floor(
      (actualCheckOutDate.setHours(0, 0, 0, 0) -
        checkInDate.setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24),
    );

    // Reset lại date objects vì setHours đã thay đổi giá trị gốc
    checkInDate.setTime(checkInDate.getTime());
    actualCheckOutDate.setTime(actualCheckOutDate.getTime());

    // Case 1: Check qua đêm (22:00 - 11:00)
    if (
      (checkInHour >= 22 || checkInHour < 11) &&
      (checkOutHour <= 11 || checkOutHour >= 22) &&
      hoursUsed >= 6 &&
      hoursUsed <= 13
    ) {
      return {
        price: roomType.priceOvernight,
        type: 'overnight',
        hours: hoursUsed,
      };
    }

    // Case 2: Check theo ngày (14:00 - 12:00 hôm sau)
    if (
      daysBetween >= 1 ||
      (checkInHour >= 14 &&
        checkOutHour <= 12 &&
        hoursUsed >= 12 &&
        hoursUsed <= 22)
    ) {
      // Nếu đủ điều kiện tính theo ngày và có nhiều ngày
      const days = Math.max(1, daysBetween);
      return {
        price: roomType.pricePerDay * days,
        type: 'day',
        days: days,
      };
    }

    // Case 3: Mặc định tính theo giờ cho các trường hợp còn lại
    // Đảm bảo ít nhất tính 1 giờ
    const billableHours = Math.max(1, hoursUsed);
    return {
      price: roomType.pricePerHour * billableHours,
      type: 'hour',
      hours: billableHours,
    };
  }
}
