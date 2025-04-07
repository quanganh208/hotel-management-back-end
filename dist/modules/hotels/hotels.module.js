"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const hotels_controller_1 = require("./hotels.controller");
const hotels_service_1 = require("./hotels.service");
const hotel_schema_1 = require("./schemas/hotel.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const helpers_module_1 = require("../../helpers/helpers.module");
const room_types_module_1 = require("../hotels.room-types/room-types.module");
const rooms_module_1 = require("../hotels.rooms/rooms.module");
const bookings_module_1 = require("../hotels.bookings/bookings.module");
const room_status_log_schema_1 = require("../hotels.rooms/schemas/room-status-log.schema");
const room_status_logs_service_1 = require("../hotels.rooms/room-status-logs.service");
let HotelsModule = class HotelsModule {
};
exports.HotelsModule = HotelsModule;
exports.HotelsModule = HotelsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: hotel_schema_1.Hotel.name, schema: hotel_schema_1.HotelSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: room_status_log_schema_1.RoomStatusLog.name, schema: room_status_log_schema_1.RoomStatusLogSchema },
            ]),
            helpers_module_1.HelpersModule,
            room_types_module_1.RoomTypesModule,
            (0, common_1.forwardRef)(() => rooms_module_1.RoomsModule),
            bookings_module_1.BookingsModule,
        ],
        controllers: [hotels_controller_1.HotelsController],
        providers: [hotels_service_1.HotelsService, room_status_logs_service_1.RoomStatusLogsService],
        exports: [hotels_service_1.HotelsService],
    })
], HotelsModule);
//# sourceMappingURL=hotels.module.js.map