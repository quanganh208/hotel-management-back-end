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
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const rooms_service_1 = require("./rooms.service");
const create_room_dto_1 = require("./dto/create-room.dto");
const mongoose_1 = require("mongoose");
const update_room_dto_1 = require("./dto/update-room.dto");
const supabase_storage_service_1 = require("../../helpers/supabase-storage.service");
const swagger_1 = require("@nestjs/swagger");
const hotels_service_1 = require("../hotels/hotels.service");
const upload_interceptor_1 = require("../../helpers/upload.interceptor");
const update_room_status_with_note_dto_1 = require("./dto/update-room-status-with-note.dto");
let RoomsController = class RoomsController {
    constructor(roomsService, supabaseStorageService, hotelsService) {
        this.roomsService = roomsService;
        this.supabaseStorageService = supabaseStorageService;
        this.hotelsService = hotelsService;
    }
    async create(req, createRoomDto, file) {
        if (req.user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn mới có quyền tạo phòng');
        }
        const hotelId = createRoomDto.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        if (ownerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền tạo phòng cho khách sạn này');
        }
        if (file) {
            createRoomDto.image = await this.supabaseStorageService.uploadFile(file, 'rooms');
        }
        const room = await this.roomsService.create(createRoomDto);
        return {
            message: 'Tạo phòng thành công',
            data: room,
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
        return this.roomsService.findAll(hotelObjectId);
    }
    async findByRoomTypeId(roomTypeId, req) {
        const roomTypeObjectId = new mongoose_1.default.Types.ObjectId(roomTypeId);
        const rooms = await this.roomsService.findByRoomTypeId(roomTypeObjectId);
        if (rooms.length > 0) {
            const hotelId = rooms[0].hotelId.toString();
            const hotel = await this.hotelsService.findOne(hotelId);
            const ownerId = this.hotelsService.extractOwnerId(hotel);
            const isOwner = ownerId === req.user.userId;
            const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
            if (!isOwner && !isStaff) {
                throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách sạn này');
            }
        }
        return rooms;
    }
    async findOne(id, req) {
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const room = await this.roomsService.findOne(objectId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập dữ liệu của khách sạn này');
        }
        return room;
    }
    async update(id, req, updateRoomDto, file) {
        if (req.user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn mới có quyền cập nhật phòng');
        }
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const room = await this.roomsService.findOne(objectId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        if (ownerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền cập nhật phòng của khách sạn này');
        }
        if (file) {
            updateRoomDto.image = await this.supabaseStorageService.uploadFile(file, 'rooms');
        }
        const updatedRoom = await this.roomsService.update(objectId, updateRoomDto);
        return {
            message: 'Cập nhật phòng thành công',
            data: updatedRoom,
        };
    }
    async remove(id, req) {
        if (req.user.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn mới có quyền xóa phòng');
        }
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const room = await this.roomsService.findOne(objectId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        if (ownerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa phòng của khách sạn này');
        }
        await this.roomsService.remove(objectId);
        return { message: 'Xóa phòng thành công' };
    }
    async updateStatus(id, req, updateRoomStatusDto) {
        if (req.user.role !== 'OWNER' && req.user.role !== 'STAFF') {
            throw new common_1.ForbiddenException('Chỉ chủ khách sạn hoặc nhân viên mới có quyền cập nhật trạng thái phòng');
        }
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        const room = await this.roomsService.findOne(objectId);
        const hotelId = room.hotelId.toString();
        const hotel = await this.hotelsService.findOne(hotelId);
        const ownerId = this.hotelsService.extractOwnerId(hotel);
        const isOwner = ownerId === req.user.userId;
        const isStaff = this.hotelsService.isUserStaffMember(hotel, req.user.userId);
        if (!isOwner && !isStaff) {
            throw new common_1.ForbiddenException('Bạn không có quyền cập nhật trạng thái phòng của khách sạn này');
        }
        const userIdObj = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const updatedRoom = await this.roomsService.updateStatus(objectId, updateRoomStatusDto.status, userIdObj, updateRoomStatusDto.note);
        return {
            message: 'Cập nhật trạng thái phòng thành công',
            data: updatedRoom,
        };
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, upload_interceptor_1.UploadInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo phòng mới (Chỉ dành cho OWNER)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Tạo phòng thành công.',
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
                roomNumber: {
                    type: 'string',
                    example: '101',
                    description: 'Số phòng',
                },
                roomTypeId: {
                    type: 'string',
                    example: '60d21b4667d0d8992e610c85',
                    description: 'ID của hạng phòng',
                },
                floor: {
                    type: 'string',
                    example: '1',
                    description: 'Tầng',
                },
                status: {
                    type: 'string',
                    example: 'available',
                    description: 'Trạng thái phòng',
                },
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Hình ảnh phòng',
                },
                note: {
                    type: 'string',
                    example: 'Phòng có view đẹp, hướng ra biển',
                    description: 'Ghi chú về phòng',
                },
            },
        },
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_room_dto_1.CreateRoomDto, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách phòng theo khách sạn' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách phòng.',
    }),
    __param(0, (0, common_1.Query)('hotelId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('room-type/:roomTypeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách phòng theo hạng phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về danh sách phòng theo hạng phòng.',
    }),
    (0, swagger_1.ApiParam)({ name: 'roomTypeId', description: 'ID của hạng phòng' }),
    __param(0, (0, common_1.Param)('roomTypeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "findByRoomTypeId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết của một phòng' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Trả về thông tin phòng.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Phòng không tồn tại.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của phòng' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, upload_interceptor_1.UploadInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin phòng (Chỉ dành cho OWNER)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cập nhật phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Phòng không tồn tại.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền thực hiện.' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của phòng' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                roomNumber: {
                    type: 'string',
                    example: '101',
                    description: 'Số phòng',
                },
                roomTypeId: {
                    type: 'string',
                    example: '60d21b4667d0d8992e610c85',
                    description: 'ID của hạng phòng',
                },
                floor: {
                    type: 'string',
                    example: '1',
                    description: 'Tầng',
                },
                status: {
                    type: 'string',
                    example: 'available',
                    description: 'Trạng thái phòng',
                },
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Hình ảnh phòng',
                },
                note: {
                    type: 'string',
                    example: 'Phòng có view đẹp, hướng ra biển',
                    description: 'Ghi chú về phòng',
                },
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_room_dto_1.UpdateRoomDto, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa phòng (Chỉ dành cho OWNER)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Xóa phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Phòng không tồn tại.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền thực hiện.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của phòng' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cập nhật trạng thái phòng (Dành cho OWNER và STAFF)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cập nhật trạng thái phòng thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Phòng không tồn tại.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền thực hiện.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID của phòng' }),
    (0, swagger_1.ApiBody)({ type: update_room_status_with_note_dto_1.UpdateRoomStatusWithNoteDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_room_status_with_note_dto_1.UpdateRoomStatusWithNoteDto]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "updateStatus", null);
exports.RoomsController = RoomsController = __decorate([
    (0, swagger_1.ApiTags)('rooms'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('rooms'),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => hotels_service_1.HotelsService))),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService,
        supabase_storage_service_1.SupabaseStorageService,
        hotels_service_1.HotelsService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map