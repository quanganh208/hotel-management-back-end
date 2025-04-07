"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_schema_1 = require("./schemas/booking.schema");
const room_schema_1 = require("../hotels.rooms/schemas/room.schema");
let BookingsService = class BookingsService {
    constructor(bookingModel, roomModel) {
        this.bookingModel = bookingModel;
        this.roomModel = roomModel;
    }
    async create(createBookingDto) {
        const booking = new this.bookingModel({
            ...createBookingDto,
            roomId: new mongoose_2.Types.ObjectId(createBookingDto.roomId),
            createdBy: new mongoose_2.Types.ObjectId(createBookingDto.createdBy),
            checkInDate: new Date(createBookingDto.checkInDate),
            checkOutDate: new Date(createBookingDto.checkOutDate),
        });
        const savedBooking = await booking.save();
        await this.roomModel.findByIdAndUpdate(createBookingDto.roomId, {
            status: 'booked',
            $push: { bookings: savedBooking._id },
        });
        return savedBooking;
    }
    async findByHotelId(hotelId) {
        const rooms = await this.roomModel.find({ hotelId }).exec();
        const roomIds = rooms.map((room) => room._id);
        return this.bookingModel
            .find({ roomId: { $in: roomIds } })
            .populate('roomId', 'roomNumber floor')
            .populate('createdBy', 'name email')
            .exec();
    }
    async findByRoomId(roomId) {
        return this.bookingModel
            .find({ roomId })
            .populate('roomId', 'roomNumber floor')
            .populate('createdBy', 'name email')
            .exec();
    }
    async findOne(id) {
        const booking = await this.bookingModel
            .findById(id)
            .populate('roomId', 'roomNumber floor hotelId')
            .populate('createdBy', 'name email')
            .exec();
        if (!booking) {
            throw new common_1.NotFoundException('Đặt phòng không tồn tại');
        }
        return booking;
    }
    async update(id, updateBookingDto) {
        const updates = { ...updateBookingDto };
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
            throw new common_1.NotFoundException('Đặt phòng không tồn tại');
        }
        return updatedBooking;
    }
    async remove(id) {
        const booking = await this.bookingModel.findById(id).exec();
        if (!booking) {
            throw new common_1.NotFoundException('Đặt phòng không tồn tại');
        }
        const { roomId } = booking;
        const deletedBooking = await this.bookingModel.findByIdAndDelete(id).exec();
        if (!deletedBooking) {
            throw new common_1.NotFoundException('Không thể xóa đặt phòng');
        }
        const bookingsForRoom = await this.bookingModel.find({ roomId }).exec();
        if (bookingsForRoom.length === 0) {
            await this.roomModel.findByIdAndUpdate(roomId, {
                status: 'available',
                $pull: { bookings: id },
            });
        }
        else {
            await this.roomModel.findByIdAndUpdate(roomId, {
                $pull: { bookings: id },
            });
        }
        return deletedBooking;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(1, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map