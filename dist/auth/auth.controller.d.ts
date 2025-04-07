import { AuthService } from './auth.service';
import { Request } from 'express';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendActivationDto } from '@/auth/dto/send-activation.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: Request): {
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
    resendActivation(sendActivationDto: SendActivationDto): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    googleAuth(googleAuthDto: GoogleAuthDto): Promise<import("@nestjs/common").BadRequestException | {
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
}
