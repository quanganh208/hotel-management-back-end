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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const mongoose_2 = require("mongoose");
const util_1 = require("../../helpers/util");
const api_query_params_1 = require("api-query-params");
const dayjs = require("dayjs");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async checkUserExists(email, excludeId) {
        const query = excludeId ? { _id: { $ne: excludeId } } : { email };
        const isUserExist = await this.userModel.findOne(query);
        if (isUserExist) {
            throw new common_1.BadRequestException('Email đã tồn tại, vui lòng sử dụng email khác');
        }
    }
    validateMongoId(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('ID không hợp lệ');
        }
    }
    async create(createUserDto) {
        await this.checkUserExists(createUserDto.email);
        const hashedPassword = await (0, util_1.hashPassword)(createUserDto.password);
        await new this.userModel({
            ...createUserDto,
            password: hashedPassword,
        }).save();
        return {
            message: 'Tạo tài khoản thành công',
        };
    }
    async findAll(query, page, limit) {
        const { filter, sort } = (0, api_query_params_1.default)(query);
        if (filter.page)
            delete filter.page;
        if (!page)
            page = 1;
        if (!limit)
            limit = 10;
        const totalItems = await this.userModel.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);
        const results = await this.userModel
            .find(filter)
            .select('-password')
            .limit(limit)
            .skip(limit * (page - 1))
            .sort(sort);
        return {
            totalItems,
            totalPages,
            results,
        };
    }
    async findOne(id) {
        this.validateMongoId(id);
        const user = await this.userModel.findById(id).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return user;
    }
    async update(id, updateUserDto) {
        this.validateMongoId(id);
        await this.checkUserExists(id);
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        await user.updateOne(updateUserDto);
        return {
            message: 'Cập nhật thông tin người dùng thành công',
        };
    }
    async remove(id) {
        this.validateMongoId(id);
        await this.checkUserExists(id);
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        await user.deleteOne();
        return {
            message: 'Xóa người dùng thành công',
        };
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email });
    }
    async findById(id) {
        this.validateMongoId(id);
        return this.userModel.findById(id);
    }
    async findByResetToken(resetToken) {
        return this.userModel.findOne({ resetToken });
    }
    async createGoogleUser(userData) {
        const existingUser = await this.userModel.findOne({
            email: userData.email,
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email đã tồn tại trong hệ thống');
        }
        return await new this.userModel({
            email: userData.email,
            name: userData.name,
            googleId: userData.googleId,
            image: userData.image,
            accountType: 'GOOGLE',
            isVerified: true,
        }).save();
    }
    async register(registerDto) {
        await this.checkUserExists(registerDto.email);
        const hashedPassword = await (0, util_1.hashPassword)(registerDto.password);
        const verificationCode = Math.floor(10000000 + Math.random() * 90000000);
        await new this.userModel({
            ...registerDto,
            password: hashedPassword,
            isVerified: false,
            verificationCode: verificationCode,
            codeExpires: dayjs().add(1, 'hours'),
        }).save();
        return {
            message: 'Đăng ký tài khoản thành công',
        };
    }
    async activateAccount(activateAccountDto) {
        const { email, verificationCode } = activateAccountDto;
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng với email này');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Tài khoản đã được kích hoạt trước đó');
        }
        if (user.verificationCode !== verificationCode) {
            throw new common_1.BadRequestException('Mã xác thực không chính xác');
        }
        if (dayjs().isAfter(user.codeExpires)) {
            throw new common_1.BadRequestException('Mã xác thực đã hết hạn');
        }
        await user.updateOne({
            isVerified: true,
            verificationCode: null,
            codeExpires: null,
        });
        return {
            message: 'Kích hoạt tài khoản thành công',
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map