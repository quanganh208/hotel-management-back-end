"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomTypesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const room_types_controller_1 = require("./room-types.controller");
const room_types_service_1 = require("./room-types.service");
const room_type_schema_1 = require("./schemas/room-type.schema");
const helpers_module_1 = require("../../helpers/helpers.module");
const hotels_service_1 = require("../hotels/hotels.service");
const hotel_schema_1 = require("../hotels/schemas/hotel.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let RoomTypesModule = class RoomTypesModule {
};
exports.RoomTypesModule = RoomTypesModule;
exports.RoomTypesModule = RoomTypesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: room_type_schema_1.RoomType.name, schema: room_type_schema_1.RoomTypeSchema },
                { name: hotel_schema_1.Hotel.name, schema: hotel_schema_1.HotelSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
            helpers_module_1.HelpersModule,
        ],
        controllers: [room_types_controller_1.RoomTypesController],
        providers: [room_types_service_1.RoomTypesService, hotels_service_1.HotelsService],
        exports: [room_types_service_1.RoomTypesService],
    })
], RoomTypesModule);
//# sourceMappingURL=room-types.module.js.map