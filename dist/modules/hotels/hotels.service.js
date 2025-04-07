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
exports.HotelsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hotel_schema_1 = require("./schemas/hotel.schema");
const user_schema_1 = require("../users/schemas/user.schema");
function hasMongoId(obj) {
    return (obj !== null &&
        typeof obj === 'object' &&
        '_id' in obj &&
        (typeof obj._id === 'string' || obj._id instanceof mongoose_2.Types.ObjectId));
}
function hasToString(obj) {
    if (obj === null || typeof obj !== 'object') {
        return false;
    }
    const hasToStringProperty = 'toString' in obj;
    if (hasToStringProperty) {
        const toStringProperty = obj['toString'];
        return typeof toStringProperty === 'function';
    }
    return false;
}
let HotelsService = class HotelsService {
    constructor(hotelModel, userModel) {
        this.hotelModel = hotelModel;
        this.userModel = userModel;
    }
    async create(createHotelDto, userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Người dùng không tồn tại');
        }
        const newHotel = new this.hotelModel({
            ...createHotelDto,
            owner: userId,
            staff: createHotelDto.staff || [],
        });
        const savedHotel = await newHotel.save();
        await this.userModel.findByIdAndUpdate(userId, {
            $push: { hotels: savedHotel._id },
        });
        if (createHotelDto.staff && createHotelDto.staff.length > 0) {
            await this.userModel.updateMany({ _id: { $in: createHotelDto.staff } }, { $push: { hotels: savedHotel._id } });
        }
        return savedHotel;
    }
    toPopulatedHotel(doc) {
        const hotelObj = doc.toObject();
        const typedOwner = hotelObj.owner;
        const typedStaff = hotelObj.staff;
        const populatedHotel = {
            ...hotelObj,
            owner: typedOwner,
            staff: typedStaff,
        };
        return populatedHotel;
    }
    async findOne(id) {
        if (id === 'owner' || id === 'staff' || id.length !== 24) {
            throw new common_1.NotFoundException('ID khách sạn không hợp lệ');
        }
        const hotel = await this.hotelModel
            .findById(id)
            .populate('owner', 'name email image')
            .populate('staff', 'name email image')
            .exec();
        if (!hotel) {
            throw new common_1.NotFoundException('Khách sạn không tồn tại');
        }
        return this.toPopulatedHotel(hotel);
    }
    async findByOwner(userId) {
        const hotels = await this.hotelModel
            .find({ owner: userId })
            .populate('owner', 'name email image')
            .populate('staff', 'name email image')
            .exec();
        return hotels.map((hotel) => this.toPopulatedHotel(hotel));
    }
    async findByStaff(userId) {
        const hotels = await this.hotelModel
            .find({ staff: userId })
            .populate('owner', 'name email image')
            .populate('staff', 'name email image')
            .exec();
        return hotels.map((hotel) => this.toPopulatedHotel(hotel));
    }
    extractOwnerId(hotel) {
        if (!hotel) {
            throw new common_1.NotFoundException('Không tìm thấy khách sạn');
        }
        const { owner } = hotel;
        if (typeof owner === 'string') {
            return owner;
        }
        if (hasMongoId(owner)) {
            return owner._id.toString();
        }
        if (hasToString(owner)) {
            return owner.toString();
        }
        throw new common_1.NotFoundException('Dữ liệu khách sạn không hợp lệ');
    }
    isUserStaffMember(hotel, userId) {
        if (!hotel || !userId || !hotel.staff || !Array.isArray(hotel.staff)) {
            return false;
        }
        return hotel.staff.some((staffMember) => {
            if (typeof staffMember === 'string') {
                return staffMember === userId;
            }
            if (hasMongoId(staffMember)) {
                return staffMember._id.toString() === userId;
            }
            if (hasToString(staffMember)) {
                return staffMember.toString() === userId;
            }
            return false;
        });
    }
};
exports.HotelsService = HotelsService;
exports.HotelsService = HotelsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hotel_schema_1.Hotel.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], HotelsService);
//# sourceMappingURL=hotels.service.js.map