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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
const rooms_service_1 = require("../hotels.rooms/rooms.service");
const hotels_service_1 = require("../hotels/hotels.service");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const update_booking_dto_1 = require("./dto/update-booking.dto");
let BookingsController = class BookingsController {
    constructor(bookingsService, roomsService, hotelsService) {
        this.bookingsService = bookingsService;
        this.roomsService = roomsService;
        this.hotelsService = hotelsService;
    }
    async create(createBookingDto, req) {
        const roomId = new mongoose_1.default.Types.ObjectId(createBookingDto.roomId);
        const room = await this.roomsService.findOne(roomId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền đặt phòng tại khách sạn này');
        }
        return this.bookingsService.create({
            ...createBookingDto,
            createdBy: req.user.userId,
        });
    }
    async findAll(hotelId, req) {
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu đặt phòng của khách sạn này');
        }
        return this.bookingsService.findByHotelId(new mongoose_1.default.Types.ObjectId(hotelId));
    }
    async findByRoomId(roomId, req) {
        const roomObjectId = new mongoose_1.default.Types.ObjectId(roomId);
        const room = await this.roomsService.findOne(roomObjectId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu đặt phòng của khách sạn này');
        }
        return this.bookingsService.findByRoomId(roomObjectId);
    }
    async findOne(id, req) {
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const booking = await this.bookingsService.findOne(objectId);
        if (!booking) {
            throw new common_1.NotFoundException('Không tìm thấy đặt phòng');
        }
        const room = await this.roomsService.findOne(new mongoose_1.default.Types.ObjectId(booking.roomId));
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập thông tin đặt phòng này');
        }
        return booking;
    }
    async update(id, updateBookingDto, req) {
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const booking = await this.bookingsService.findOne(objectId);
        if (!booking) {
            throw new common_1.NotFoundException('Không tìm thấy đặt phòng');
        }
        const room = await this.roomsService.findOne(new mongoose_1.default.Types.ObjectId(booking.roomId));
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền cập nhật thông tin đặt phòng này');
        }
        return this.bookingsService.update(objectId, updateBookingDto);
    }
    async remove(id, req) {
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const booking = await this.bookingsService.findOne(objectId);
        if (!booking) {
            throw new common_1.NotFoundException('Không tìm thấy đặt phòng');
        }
        const room = await this.roomsService.findOne(new mongoose_1.default.Types.ObjectId(booking.roomId));
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền hủy đặt phòng này');
        }
        return this.bookingsService.remove(objectId);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo đặt phòng mới' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Đặt phòng thành công.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách đặt phòng theo khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách đặt phòng.',
    }),
    __param(0, (0, common_1.Query)('hotelId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('room/:roomId'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách đặt phòng theo phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách đặt phòng theo phòng.',
    }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findByRoomId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết đặt phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về thông tin đặt phòng.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Đặt phòng không tồn tại.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin đặt phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cập nhật đặt phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Đặt phòng không tồn tại.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_booking_dto_1.UpdateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Hủy đặt phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Hủy đặt phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Đặt phòng không tồn tại.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "remove", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService,
        rooms_service_1.RoomsService,
        hotels_service_1.HotelsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map