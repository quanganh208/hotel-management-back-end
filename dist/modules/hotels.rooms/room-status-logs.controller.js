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
exports.RoomStatusLogsController = void 0;
const common_1 = require("@nestjs/common");
const room_status_logs_service_1 = require("./room-status-logs.service");
const mongoose_1 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
const hotels_service_1 = require("../hotels/hotels.service");
const rooms_service_1 = require("./rooms.service");
let RoomStatusLogsController = class RoomStatusLogsController {
    constructor(roomStatusLogsService, roomsService, hotelsService) {
        this.roomStatusLogsService = roomStatusLogsService;
        this.roomsService = roomsService;
        this.hotelsService = hotelsService;
    }
    async findByRoomId(roomId, limit = '10', offset = '0', req) {
        const roomObjectId = new mongoose_1.default.Types.ObjectId(roomId);
        const room = await this.roomsService.findOne(roomObjectId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách sạn này');
        }
        return this.roomStatusLogsService.findByRoomId(roomObjectId, parseInt(limit), parseInt(offset));
    }
    async findByHotelId(hotelId, limit = '10', offset = '0', req) {
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách sạn này');
        }
        const hotelObjectId = new mongoose_1.default.Types.ObjectId(hotelId);
        return this.roomStatusLogsService.findByHotelId(hotelObjectId, parseInt(limit), parseInt(offset));
    }
};
exports.RoomStatusLogsController = RoomStatusLogsController;
__decorate([
    (0, common_1.Get)('room/:roomId'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử trạng thái của một phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về lịch sử trạng thái phòng.',
    }),
    (0, swagger_1.ApiParam)({ name: 'roomId', description: 'ID của phòng' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: 'Số lượng bản ghi tối đa',
        required: false,
        type: Number,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        description: 'Vị trí bắt đầu',
        required: false,
        type: Number,
    }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomStatusLogsController.prototype, "findByRoomId", null);
__decorate([
    (0, common_1.Get)('hotel/:hotelId'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử trạng thái phòng theo khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về lịch sử trạng thái phòng theo khách sạn.',
    }),
    (0, swagger_1.ApiParam)({ name: 'hotelId', description: 'ID của khách sạn' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: 'Số lượng bản ghi tối đa',
        required: false,
        type: Number,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        description: 'Vị trí bắt đầu',
        required: false,
        type: Number,
    }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomStatusLogsController.prototype, "findByHotelId", null);
exports.RoomStatusLogsController = RoomStatusLogsController = __decorate([
    (0, swagger_1.ApiTags)('room-status-logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('room-status-logs'),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => hotels_service_1.HotelsService))),
    __metadata("design:paramtypes", [room_status_logs_service_1.RoomStatusLogsService,
        rooms_service_1.RoomsService,
        hotels_service_1.HotelsService])
], RoomStatusLogsController);
//# sourceMappingURL=room-status-logs.controller.js.map