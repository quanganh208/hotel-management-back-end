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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../modules/users/users.service");
const util_1 = require("../helpers/util");
const jwt_1 = require("@nestjs/jwt");
const process = require("node:process");
const dayjs = require("dayjs");
const mailer_1 = require("@nestjs-modules/mailer");
const google_auth_library_1 = require("google-auth-library");
let AuthService = class AuthService {
    constructor(usersService, jwtService, mailerService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.mailerService = mailerService;
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (!user || !(await (0, util_1.comparePasswords)(pass, user.password)))
            return null;
        return user;
    }
    login(user) {
        const payload = {
            sub: user._id,
            email: user.email,
            name: user.name,
            accountType: user.accountType,
            role: user.role,
        };
        return {
            message: 'Đăng nhập thành công',
            access_token: this.jwtService.sign(payload),
            token_type: 'Bearer',
            expires_in: process.env.JWT_EXPIRES_IN,
            _id: user._id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            image: user.image,
        };
    }
    async register(registerDto) {
        return await this.usersService.register(registerDto);
    }
    async activate(activateAccountDto) {
        return await this.usersService.activateAccount(activateAccountDto);
    }
    async sendActivation(sendActivationDto) {
        const user = await this.usersService.findByEmail(sendActivationDto.email);
        if (!user) {
            throw new common_1.BadRequestException('Email không tồn tại trong hệ thống');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Tài khoản đã được kích hoạt trước đó');
        }
        let verificationCode;
        if (user.verificationCode &&
            user.codeExpires &&
            dayjs().isBefore(dayjs(user.codeExpires))) {
            verificationCode = Number(user.verificationCode);
        }
        else {
            verificationCode = Math.floor(10000000 + Math.random() * 90000000);
            await user.updateOne({
                verificationCode: verificationCode,
                codeExpires: dayjs().add(1, 'hours').toDate(),
            });
        }
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Kích hoạt tài khoản của bạn tại website Hotel Management',
            template: 'register',
            context: {
                name: user.name,
                code: verificationCode,
                year: new Date().getFullYear(),
            },
        });
        return {
            message: 'Mã kích hoạt đã được gửi đến email của bạn',
        };
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        if (!user) {
            throw new common_1.BadRequestException('Email không tồn tại trong hệ thống');
        }
        const resetToken = (0, util_1.generateResetToken)();
        await user.updateOne({
            resetToken: resetToken,
            codeExpires: dayjs().add(1, 'hours').toDate(),
        });
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Đặt lại mật khẩu tại website Hotel Management',
            template: 'forgot-password',
            context: {
                name: user.name,
                resetUrl: resetUrl,
                year: new Date().getFullYear(),
            },
        });
        return {
            message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn',
        };
    }
    async resetPassword(resetPasswordDto) {
        const user = await this.usersService.findByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new common_1.BadRequestException('Token không hợp lệ hoặc đã hết hạn');
        }
        if (!user.codeExpires || dayjs().isAfter(dayjs(user.codeExpires))) {
            throw new common_1.BadRequestException('Token đã hết hạn');
        }
        try {
            const hashedPassword = await (0, util_1.hashPassword)(resetPasswordDto.newPassword);
            await user.updateOne({
                password: hashedPassword,
                resetToken: null,
                codeExpires: null,
            });
            return {
                message: 'Mật khẩu đã được đặt lại thành công',
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Lỗi khi đặt lại mật khẩu');
        }
    }
    async googleAuth(googleAuthDto) {
        try {
            const ticket = await this.verifyGoogleIdToken(googleAuthDto.idToken);
            if (!ticket) {
                return new common_1.BadRequestException('Google ID token không hợp lệ');
            }
            const payload = ticket.getPayload();
            if (!payload) {
                return new common_1.BadRequestException('Không thể lấy thông tin từ Google ID token');
            }
            const { email, name, sub: googleId, picture: image } = payload;
            if (!email) {
                return new common_1.BadRequestException('Email không được cung cấp từ Google');
            }
            const existingUser = await this.usersService.findByEmail(email);
            if (existingUser) {
                if (existingUser.accountType === 'GOOGLE') {
                    if (existingUser.googleId !== googleId ||
                        existingUser.name !== name ||
                        existingUser.image !== image) {
                        await existingUser.updateOne({
                            googleId: googleId,
                            name: name,
                            image: image,
                        });
                    }
                }
                else {
                    await existingUser.updateOne({
                        googleId: googleId,
                        image: existingUser.image || image,
                    });
                }
                return this.login(existingUser);
            }
            else {
                const newUser = await this.usersService.createGoogleUser({
                    email,
                    name: name || '',
                    googleId,
                    image,
                });
                return this.login(newUser);
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Lỗi khi xử lý đăng nhập với Google');
        }
    }
    async verifyGoogleIdToken(idToken) {
        try {
            const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            return await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        }
        catch (error) {
            console.error('Lỗi xác thực Google ID token:', error);
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        mailer_1.MailerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map