"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bookings_controller_1 = require("./bookings.controller");
const bookings_service_1 = require("./bookings.service");
const booking_schema_1 = require("./schemas/booking.schema");
const room_schema_1 = require("../hotels.rooms/schemas/room.schema");
const rooms_service_1 = require("../hotels.rooms/rooms.service");
const hotels_service_1 = require("../hotels/hotels.service");
const hotel_schema_1 = require("../hotels/schemas/hotel.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const room_types_module_1 = require("../hotels.room-types/room-types.module");
const room_types_service_1 = require("../hotels.room-types/room-types.service");
const room_type_schema_1 = require("../hotels.room-types/schemas/room-type.schema");
const room_status_logs_service_1 = require("../hotels.rooms/room-status-logs.service");
const room_status_log_schema_1 = require("../hotels.rooms/schemas/room-status-log.schema");
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: booking_schema_1.Booking.name, schema: booking_schema_1.BookingSchema },
                { name: room_schema_1.Room.name, schema: room_schema_1.RoomSchema },
                { name: hotel_schema_1.Hotel.name, schema: hotel_schema_1.HotelSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: room_type_schema_1.RoomType.name, schema: room_type_schema_1.RoomTypeSchema },
                { name: room_status_log_schema_1.RoomStatusLog.name, schema: room_status_log_schema_1.RoomStatusLogSchema },
            ]),
            room_types_module_1.RoomTypesModule,
        ],
        controllers: [bookings_controller_1.BookingsController],
        providers: [
            bookings_service_1.BookingsService,
            rooms_service_1.RoomsService,
            hotels_service_1.HotelsService,
            room_types_service_1.RoomTypesService,
            room_status_logs_service_1.RoomStatusLogsService,
        ],
        exports: [bookings_service_1.BookingsService],
    })
], BookingsModule);
//# sourceMappingURL=bookings.module.js.map