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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoomStatusLogDto = void 0;
const class_validator_1 = require("class-validator");
const mongoose_1 = require("mongoose");
const room_schema_1 = require("../schemas/room.schema");
const swagger_1 = require("@nestjs/swagger");
class CreateRoomStatusLogDto {
}
exports.CreateRoomStatusLogDto = CreateRoomStatusLogDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID của phòng',
        example: '60d21b4667d0d8992e610c85',
    }),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateRoomStatusLogDto.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Trạng thái phòng mới',
        enum: room_schema_1.RoomStatus,
        example: room_schema_1.RoomStatus.CLEANING,
    }),
    (0, class_validator_1.IsEnum)(room_schema_1.RoomStatus),
    __metadata("design:type", String)
], CreateRoomStatusLogDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Trạng thái phòng trước đó',
        enum: room_schema_1.RoomStatus,
        example: room_schema_1.RoomStatus.CHECKED_OUT,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(room_schema_1.RoomStatus),
    __metadata("design:type", String)
], CreateRoomStatusLogDto.prototype, "previousStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID của người thay đổi',
        example: '60d21b4667d0d8992e610c85',
    }),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateRoomStatusLogDto.prototype, "changedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ghi chú về việc thay đổi trạng thái',
        example: 'Dọn dẹp sau khi khách check-out',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomStatusLogDto.prototype, "note", void 0);
//# sourceMappingURL=create-room-status-log.dto.js.map