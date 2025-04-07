"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsModule = void 0;
const common_1 = require("@nestjs/common");
const rooms_service_1 = require("./rooms.service");
const rooms_controller_1 = require("./rooms.controller");
const mongoose_1 = require("@nestjs/mongoose");
const room_schema_1 = require("./schemas/room.schema");
const room_types_module_1 = require("../hotels.room-types/room-types.module");
const supabase_storage_service_1 = require("../../helpers/supabase-storage.service");
const hotels_module_1 = require("../hotels/hotels.module");
const room_status_logs_service_1 = require("./room-status-logs.service");
const room_status_logs_controller_1 = require("./room-status-logs.controller");
const room_status_log_schema_1 = require("./schemas/room-status-log.schema");
let RoomsModule = class RoomsModule {
};
exports.RoomsModule = RoomsModule;
exports.RoomsModule = RoomsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: room_schema_1.Room.name, schema: room_schema_1.RoomSchema },
                { name: room_status_log_schema_1.RoomStatusLog.name, schema: room_status_log_schema_1.RoomStatusLogSchema },
            ]),
            room_types_module_1.RoomTypesModule,
            (0, common_1.forwardRef)(() => hotels_module_1.HotelsModule),
        ],
        controllers: [rooms_controller_1.RoomsController, room_status_logs_controller_1.RoomStatusLogsController],
        providers: [rooms_service_1.RoomsService, supabase_storage_service_1.SupabaseStorageService, room_status_logs_service_1.RoomStatusLogsService],
        exports: [rooms_service_1.RoomsService],
    })
], RoomsModule);
//# sourceMappingURL=rooms.module.js.map