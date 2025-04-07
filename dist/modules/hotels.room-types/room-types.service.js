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
exports.RoomTypesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const room_type_schema_1 = require("./schemas/room-type.schema");
let RoomTypesService = class RoomTypesService {
    constructor(roomTypeModel) {
        this.roomTypeModel = roomTypeModel;
    }
    async create(createRoomTypeDto) {
        const newRoomType = new this.roomTypeModel(createRoomTypeDto);
        return newRoomType.save();
    }
    async findAll(hotelId) {
        return this.roomTypeModel.find({ hotelId }).populate('rooms').exec();
    }
    async findOne(id) {
        const roomType = await this.roomTypeModel
            .findById(id)
            .populate('rooms')
            .exec();
        if (!roomType) {
            throw new common_1.NotFoundException(`Room type với ID ${id.toString()} không tìm thấy`);
        }
        return roomType;
    }
    async findByHotelId(hotelId) {
        return this.roomTypeModel.find({ hotelId }).populate('rooms').exec();
    }
    async update(id, updateRoomTypeDto) {
        const updatedRoomType = await this.roomTypeModel
            .findByIdAndUpdate(id, { $set: updateRoomTypeDto }, { new: true })
            .populate('rooms');
        if (!updatedRoomType) {
            throw new common_1.NotFoundException(`Room type với ID ${id.toString()} không tìm thấy`);
        }
        return updatedRoomType;
    }
    async remove(id) {
        const deletedRoomType = await this.roomTypeModel.findByIdAndDelete(id);
        if (!deletedRoomType) {
            throw new common_1.NotFoundException(`Room type với ID ${id.toString()} không tìm thấy`);
        }
        return deletedRoomType;
    }
    async addRoomToRoomType(roomTypeId, roomId) {
        const updatedRoomType = await this.roomTypeModel
            .findByIdAndUpdate(roomTypeId, { $push: { rooms: roomId } }, { new: true })
            .populate('rooms');
        if (!updatedRoomType) {
            throw new common_1.NotFoundException(`Room type với ID ${roomTypeId.toString()} không tìm thấy`);
        }
        return updatedRoomType;
    }
    async removeRoomFromRoomType(roomTypeId, roomId) {
        const updatedRoomType = await this.roomTypeModel
            .findByIdAndUpdate(roomTypeId, { $pull: { rooms: roomId } }, { new: true })
            .populate('rooms');
        if (!updatedRoomType) {
            throw new common_1.NotFoundException(`Room type với ID ${roomTypeId.toString()} không tìm thấy`);
        }
        return updatedRoomType;
    }
};
exports.RoomTypesService = RoomTypesService;
exports.RoomTypesService = RoomTypesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(room_type_schema_1.RoomType.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RoomTypesService);
//# sourceMappingURL=room-types.service.js.map