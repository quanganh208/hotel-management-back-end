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
exports.RoomTypesController = void 0;
const common_1 = require("@nestjs/common");
const room_types_service_1 = require("./room-types.service");
const create_room_type_dto_1 = require("./dto/create-room-type.dto");
const mongoose_1 = require("mongoose");
const update_room_type_dto_1 = require("./dto/update-room-type.dto");
const supabase_storage_service_1 = require("../../helpers/supabase-storage.service");
const swagger_1 = require("@nestjs/swagger");
const hotels_service_1 = require("../hotels/hotels.service");
const upload_interceptor_1 = require("../../helpers/upload.interceptor");
let RoomTypesController = class RoomTypesController {
    constructor(roomTypesService, supabaseStorageService, hotelsService) {
        this.roomTypesService = roomTypesService;
        this.supabaseStorageService = supabaseStorageService;
        this.hotelsService = hotelsService;
    }
    async create(req, createRoomTypeDto, file) {
        if (req.user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn mới có quyền tạo hạng phòng');
        }
        const hotelId = createRoomTypeDto.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        if (ownerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền tạo hạng phòng cho khách sạn này');
        }
        if (file) {
            createRoomTypeDto.image = await this.supabaseStorageService.uploadFile(file, 'room-types');
        }
        const roomType = await this.roomTypesService.create(createRoomTypeDto);
        return {
            message: 'Tạo hạng phòng thành công',
            data: roomType,
        };
    }
    async findAll(hotelId, req) {
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách sạn này');
        }
        const hotelObjectId = new mongoose_1.default.Types.ObjectId(hotelId);
        return this.roomTypesService.findAll(hotelObjectId);
    }
    async findOne(id, req) {
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const roomType = await this.roomTypesService.findOne(objectId);
        const hotelId = roomType.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách sạn này');
        }
        return roomType;
    }
    async update(id, req, updateRoomTypeDto, file) {
        if (req.user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn mới có quyền cập nhật hạng phòng');
        }
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const roomType = await this.roomTypesService.findOne(objectId);
        const hotelId = roomType.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        if (ownerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền cập nhật hạng phòng của khách sạn này');
        }
        if (file) {
            updateRoomTypeDto.image = await this.supabaseStorageService.uploadFile(file, 'room-types');
        }
        const updatedRoomType = await this.roomTypesService.update(objectId, updateRoomTypeDto);
        return {
            message: 'Cập nhật hạng phòng thành công',
            data: updatedRoomType,
        };
    }
    async remove(id, req) {
        if (req.user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn mới có quyền xóa hạng phòng');
        }
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const roomType = await this.roomTypesService.findOne(objectId);
        const hotelId = roomType.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        if (ownerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa hạng phòng của khách sạn này');
        }
        await this.roomTypesService.remove(objectId);
        return { message: 'Xóa hạng phòng thành công' };
    }
};
exports.RoomTypesController = RoomTypesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, upload_interceptor_1.UploadInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo hạng phòng mới (Chỉ dành cho OWNER)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Tạo hạng phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dữ liệu không hợp lệ.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền thực hiện.' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                hotelId: {
                    type: 'string',
                    example: '60d21b4667d0d8992e610c85',
                    description: 'ID của khách sạn',
                },
                name: {
                    type: 'string',
                    example: 'Deluxe',
                    description: 'Tên hạng phòng',
                },
                pricePerHour: {
                    type: 'number',
                    example: 200000,
                    description: 'Giá theo giờ',
                },
                pricePerDay: {
                    type: 'number',
                    example: 500000,
                    description: 'Giá theo ngày',
                },
                priceOvernight: {
                    type: 'number',
                    example: 800000,
                    description: 'Giá qua đêm',
                },
                description: {
                    type: 'string',
                    example: 'Phòng Deluxe với view đẹp',
                    description: 'Mô tả hạng phòng',
                },
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Hình ảnh hạng phòng',
                },
            },
        },
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_room_type_dto_1.CreateRoomTypeDto, Object]),
    __metadata("design:returntype", Promise)
], RoomTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách hạng phòng theo khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách hạng phòng.',
    }),
    __param(0, (0, common_1.Query)('hotelId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết của một hạng phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về thông tin hạng phòng.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hạng phòng không tồn tại.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của hạng phòng' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, upload_interceptor_1.UploadInterceptor)('image')),
    (0, swagger_1.ApiOperation)({
        summary: 'Cập nhật thông tin hạng phòng (Chỉ dành cho OWNER)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cập nhật hạng phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hạng phòng không tồn tại.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền thực hiện.' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của hạng phòng' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_room_type_dto_1.UpdateRoomTypeDto, Object]),
    __metadata("design:returntype", Promise)
], RoomTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa hạng phòng (Chỉ dành cho OWNER)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Xóa hạng phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Hạng phòng không tồn tại.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền thực hiện.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của hạng phòng' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomTypesController.prototype, "remove", null);
exports.RoomTypesController = RoomTypesController = __decorate([
    (0, swagger_1.ApiTags)('room-types'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('room-types'),
    __metadata("design:paramtypes", [room_types_service_1.RoomTypesService,
        supabase_storage_service_1.SupabaseStorageService,
        hotels_service_1.HotelsService])
], RoomTypesController);
//# sourceMappingURL=room-types.controller.js.map