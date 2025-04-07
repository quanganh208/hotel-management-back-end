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
exports.CreateRoomTypeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mongoose_1 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
class CreateRoomTypeDto {
}
exports.CreateRoomTypeDto = CreateRoomTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID của khách sạn',
        example: '60d21b4667d0d8992e610c85',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateRoomTypeDto.prototype, "hotelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tên hạng phòng',
        example: 'Deluxe',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Giá theo giờ',
        example: 200000,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? Number(value) : value)),
    __metadata("design:type", Number)
], CreateRoomTypeDto.prototype, "pricePerHour", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Giá theo ngày',
        example: 500000,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? Number(value) : value)),
    __metadata("design:type", Number)
], CreateRoomTypeDto.prototype, "pricePerDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Giá qua đêm',
        example: 800000,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? Number(value) : value)),
    __metadata("design:type", Number)
], CreateRoomTypeDto.prototype, "priceOvernight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mô tả hạng phòng',
        example: 'Phòng Deluxe với view đẹp',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Đường dẫn hình ảnh',
        example: 'https://example.com/image.jpg',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomTypeDto.prototype, "image", void 0);
//# sourceMappingURL=create-room-type.dto.js.map