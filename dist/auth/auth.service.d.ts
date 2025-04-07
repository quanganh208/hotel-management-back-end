import { BadRequestException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '@/modules/users/schemas/user.schema';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { SendActivationDto } from './dto/send-activation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly mailerService;
    constructor(usersService: UsersService, jwtService: JwtService, mailerService: MailerService);
    validateUser(email: string, pass: string): Promise<UserDocument | null>;
    login(user: UserDocument): {
        message: string;
        access_token: string;
        token_type: string;
        expires_in: string | undefined;
        _id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        accountType: string;
        image: string;
    };
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    activate(activateAccountDto: ActivateAccountDto): Promise<{
        message: string;
    }>;
    sendActivation(sendActivationDto: SendActivationDto): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    googleAuth(googleAuthDto: GoogleAuthDto): Promise<BadRequestException | {
        message: string;
        access_token: string;
        token_type: string;
        expires_in: string | undefined;
        _id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        accountType: string;
        image: string;
    }>;
    private verifyGoogleIdToken;
}
