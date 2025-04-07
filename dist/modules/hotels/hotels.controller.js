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
exports.HotelsController = void 0;
const common_1 = require("@nestjs/common");
const hotels_service_1 = require("./hotels.service");
const create_hotel_dto_1 = require("./dto/create-hotel.dto");
const swagger_1 = require("@nestjs/swagger");
const supabase_storage_service_1 = require("../../helpers/supabase-storage.service");
const upload_interceptor_1 = require("../../helpers/upload.interceptor");
const mongoose_1 = require("mongoose");
const room_types_service_1 = require("../hotels.room-types/room-types.service");
const rooms_service_1 = require("../hotels.rooms/rooms.service");
let HotelsController = class HotelsController {
    constructor(hotelsService, supabaseStorageService, roomTypesService, roomsService) {
        this.hotelsService = hotelsService;
        this.supabaseStorageService = supabaseStorageService;
        this.roomTypesService = roomTypesService;
        this.roomsService = roomsService;
    }
    async create(createHotelDto, req, file) {
        if (file) {
            createHotelDto.image = await this.supabaseStorageService.uploadFile(file, 'hotels');
        }
        const hotel = await this.hotelsService.create(createHotelDto, req.user.userId);
        return {
            hotel,
            message: 'Tạo khách sạn thành công',
        };
    }
    async findMyHotels(req) {
        const { userId, role } = req.user;
        if (role === 'OWNER') {
            return this.hotelsService.findByOwner(userId);
        }
        else {
            return this.hotelsService.findByStaff(userId);
        }
    }
    async findOne(id, req) {
        const hotel = await this.hotelsService.findOne(id);
        const userId = req.user.userId;
        const hotelOwnerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = hotelOwnerId ? hotelOwnerId === userId : false;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập thông tin khách sạn này');
        }
        return hotel;
    }
    async getRoomTypes(id, req) {
        const hotel = await this.hotelsService.findOne(id);
        const userId = req.user.userId;
        const hotelOwnerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = hotelOwnerId ? hotelOwnerId === userId : false;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập thông tin khách sạn này');
        }
        const hotelId = new mongoose_1.default.Types.ObjectId(id);
        return this.roomTypesService.findByHotelId(hotelId);
    }
    async getRooms(id, req) {
        const hotel = await this.hotelsService.findOne(id);
        const userId = req.user.userId;
        const hotelOwnerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = hotelOwnerId ? hotelOwnerId === userId : false;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập thông tin khách sạn này');
        }
        const hotelId = new mongoose_1.default.Types.ObjectId(id);
        return this.roomsService.findByHotelId(hotelId);
    }
};
exports.HotelsController = HotelsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, upload_interceptor_1.UploadInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo khách sạn mới' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Tạo khách sạn thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dữ liệu không hợp lệ.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Không có quyền truy cập.' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'Khách sạn ABC',
                    description: 'Tên khách sạn',
                },
                address: {
                    type: 'string',
                    example: '123 Đường ABC, Hà Nội',
                    description: 'Địa chỉ khách sạn',
                },
                staff: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Danh sách ID nhân viên',
                },
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Hình ảnh khách sạn',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hotel_dto_1.CreateHotelDto, Object, Object]),
    __metadata("design:returntype", Promise)
], HotelsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Lấy danh sách khách sạn của người dùng hiện tại dựa theo role',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách khách sạn.',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Không có quyền truy cập.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HotelsController.prototype, "findMyHotels", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết của một khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về thông tin khách sạn.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Khách sạn không tồn tại.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Không có quyền truy cập khách sạn này.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của khách sạn' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HotelsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/room-types'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách hạng phòng theo khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách hạng phòng.',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền truy cập.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của khách sạn' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HotelsController.prototype, "getRoomTypes", null);
__decorate([
    (0, common_1.Get)(':id/rooms'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách phòng theo khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách phòng.',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền truy cập.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của khách sạn' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HotelsController.prototype, "getRooms", null);
exports.HotelsController = HotelsController = __decorate([
    (0, swagger_1.ApiTags)('hotels'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('hotels'),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => rooms_service_1.RoomsService))),
    __metadata("design:paramtypes", [hotels_service_1.HotelsService,
        supabase_storage_service_1.SupabaseStorageService,
        room_types_service_1.RoomTypesService,
        rooms_service_1.RoomsService])
], HotelsController);
//# sourceMappingURL=hotels.controller.js.map