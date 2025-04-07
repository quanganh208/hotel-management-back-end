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
exports.ActivateAccountDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ActivateAccountDto {
}
exports.ActivateAccountDto = ActivateAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email của người dùng',
        example: 'user@example.com',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email không được để trống' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email không đúng định dạng' }),
    __metadata("design:type", String)
], ActivateAccountDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mã xác thực được gửi đến email',
        example: '123456',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mã xác thực không được để trống' }),
    (0, class_validator_1.IsString)({ message: 'Mã xác thực phải là chuỗi ký tự' }),
    __metadata("design:type", String)
], ActivateAccountDto.prototype, "verificationCode", void 0);
//# sourceMappingURL=activate-account.dto.js.map