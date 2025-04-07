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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const room_schema_1 = require("./schemas/room.schema");
const room_types_service_1 = require("../hotels.room-types/room-types.service");
const room_status_logs_service_1 = require("./room-status-logs.service");
let RoomsService = class RoomsService {
    constructor(roomModel, roomTypesService, roomStatusLogsService) {
        this.roomModel = roomModel;
        this.roomTypesService = roomTypesService;
        this.roomStatusLogsService = roomStatusLogsService;
    }
    async create(createRoomDto) {
        await this.roomTypesService.findOne(createRoomDto.roomTypeId);
        const newRoom = new this.roomModel(createRoomDto);
        const savedRoom = await newRoom.save();
        await this.roomTypesService.addRoomToRoomType(createRoomDto.roomTypeId, savedRoom._id);
        return savedRoom;
    }
    async findAll(hotelId) {
        return this.roomModel.find({ hotelId }).populate('roomTypeId').exec();
    }
    async findOne(id) {
        const room = await this.roomModel
            .findById(id)
            .populate('roomTypeId')
            .exec();
        if (!room) {
            throw new common_1.NotFoundException(`Phòng với ID ${id.toString()} không tìm thấy`);
        }
        return room;
    }
    async findByHotelId(hotelId) {
        return this.roomModel.find({ hotelId }).populate('roomTypeId').exec();
    }
    async findByRoomTypeId(roomTypeId) {
        return this.roomModel.find({ roomTypeId }).populate('roomTypeId').exec();
    }
    async update(id, updateRoomDto) {
        if (updateRoomDto.roomTypeId) {
            await this.roomTypesService.findOne(updateRoomDto.roomTypeId);
        }
        const existingRoom = await this.findOne(id);
        const oldRoomTypeId = existingRoom.roomTypeId;
        const updatedRoom = await this.roomModel
            .findByIdAndUpdate(id, { $set: updateRoomDto }, { new: true })
            .populate('roomTypeId');
        if (!updatedRoom) {
            throw new common_1.NotFoundException(`Phòng với ID ${id.toString()} không tìm thấy`);
        }
        if (updateRoomDto.roomTypeId &&
            oldRoomTypeId.toString() !== updateRoomDto.roomTypeId.toString()) {
            await this.roomTypesService.removeRoomFromRoomType(oldRoomTypeId, id);
            await this.roomTypesService.addRoomToRoomType(updateRoomDto.roomTypeId, id);
        }
        return updatedRoom;
    }
    async updateStatus(id, status, userId, note) {
        const currentRoom = await this.findOne(id);
        const previousStatus = currentRoom.status;
        const updatedRoom = await this.roomModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .populate('roomTypeId');
        if (!updatedRoom) {
            throw new common_1.NotFoundException(`Phòng với ID ${id.toString()} không tìm thấy`);
        }
        const logDto = {
            roomId: id,
            status: status,
            previousStatus: previousStatus,
            changedBy: userId,
            note: note,
        };
        await this.roomStatusLogsService.create(logDto);
        return updatedRoom;
    }
    async remove(id) {
        const room = await this.findOne(id);
        await this.roomTypesService.removeRoomFromRoomType(room.roomTypeId, id);
        const deletedRoom = await this.roomModel.findByIdAndDelete(id);
        if (!deletedRoom) {
            throw new common_1.NotFoundException(`Phòng với ID ${id.toString()} không tìm thấy`);
        }
        return deletedRoom;
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        room_types_service_1.RoomTypesService,
        room_status_logs_service_1.RoomStatusLogsService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map