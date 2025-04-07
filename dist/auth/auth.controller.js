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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const local_auth_guard_1 = require("./passport/local-auth.guard");
const customize_1 = require("../decorator/customize");
const register_dto_1 = require("./dto/register.dto");
const activate_account_dto_1 = require("./dto/activate-account.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const send_activation_dto_1 = require("./dto/send-activation.dto");
const google_auth_dto_1 = require("./dto/google-auth.dto");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    login(req) {
        return this.authService.login(req.user);
    }
    register(registerDto) {
        return this.authService.register(registerDto);
    }
    activate(activateAccountDto) {
        return this.authService.activate(activateAccountDto);
    }
    resendActivation(sendActivationDto) {
        return this.authService.sendActivation(sendActivationDto);
    }
    forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }
    resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    googleAuth(googleAuthDto) {
        return this.authService.googleAuth(googleAuthDto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng nhập thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Đăng nhập không thành công.' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    example: 'user@example.com',
                    description: 'Email của người dùng',
                },
                password: {
                    type: 'string',
                    example: 'password123',
                    description: 'Mật khẩu của người dùng',
                },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng ký tài khoản mới' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Đăng ký thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dữ liệu không hợp lệ.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('activate'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Kích hoạt tài khoản' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Kích hoạt thành công.' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Dữ liệu không hợp lệ hoặc mã hết hạn.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [activate_account_dto_1.ActivateAccountDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)('send-activation'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Gửi lại mã kích hoạt' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gửi mã kích hoạt thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Người dùng không tồn tại.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_activation_dto_1.SendActivationDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resendActivation", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Quên mật khẩu' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Gửi email đặt lại mật khẩu thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Người dùng không tồn tại.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đặt lại mật khẩu' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đặt lại mật khẩu thành công.' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Token không hợp lệ hoặc đã hết hạn.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('google-auth'),
    (0, customize_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập bằng Google' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Đăng nhập Google thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Token không hợp lệ.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_auth_dto_1.GoogleAuthDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleAuth", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map