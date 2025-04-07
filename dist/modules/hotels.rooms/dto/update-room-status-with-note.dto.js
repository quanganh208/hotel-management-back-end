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
exports.UpdateRoomStatusWithNoteDto = void 0;
const class_validator_1 = require("class-validator");
const update_room_status_dto_1 = require("./update-room-status.dto");
const swagger_1 = require("@nestjs/swagger");
class UpdateRoomStatusWithNoteDto extends update_room_status_dto_1.UpdateRoomStatusDto {
}
exports.UpdateRoomStatusWithNoteDto = UpdateRoomStatusWithNoteDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ghi chú về việc thay đổi trạng thái',
        example: 'Dọn dẹp sau khi khách check-out',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomStatusWithNoteDto.prototype, "note", void 0);
//# sourceMappingURL=update-room-status-with-note.dto.js.map