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
exports.RoomSchema = exports.Room = exports.RoomStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const room_type_schema_1 = require("../../hotels.room-types/schemas/room-type.schema");
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["AVAILABLE"] = "available";
    RoomStatus["OCCUPIED"] = "occupied";
    RoomStatus["BOOKED"] = "booked";
    RoomStatus["CHECKED_IN"] = "checked_in";
    RoomStatus["CHECKED_OUT"] = "checked_out";
    RoomStatus["CLEANING"] = "cleaning";
    RoomStatus["MAINTENANCE"] = "maintenance";
    RoomStatus["OUT_OF_SERVICE"] = "out_of_service";
    RoomStatus["RESERVED"] = "reserved";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
let Room = class Room {
};
exports.Room = Room;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Hotel', required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Room.prototype, "hotelId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Room.prototype, "roomNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'RoomType',
        required: true,
    }),
    __metadata("design:type", room_type_schema_1.RoomType)
], Room.prototype, "roomTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Room.prototype, "floor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: RoomStatus, default: RoomStatus.AVAILABLE }),
    __metadata("design:type", String)
], Room.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Room.prototype, "image", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Room.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Booking' }] }),
    __metadata("design:type", Array)
], Room.prototype, "bookings", void 0);
exports.Room = Room = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Room);
exports.RoomSchema = mongoose_1.SchemaFactory.createForClass(Room);
//# sourceMappingURL=room.schema.js.map