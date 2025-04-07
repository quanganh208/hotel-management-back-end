import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from '@/auth/dto/activate-account.dto';
import { GoogleUserData } from './types/user.types';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<User>);
    private checkUserExists;
    private validateMongoId;
    create(createUserDto: CreateUserDto): Promise<{
        message: string;
    }>;
    findAll(query: string, page: number, limit: number): Promise<{
        totalItems: number;
        totalPages: number;
        results: (import("mongoose").Document<unknown, {}, User> & User & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        })[];
    }>;
    findOne(id: string): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        message: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findByEmail(email: string): Promise<(import("mongoose").Document<unknown, {}, User> & User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, User> & User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    findByResetToken(resetToken: string): Promise<(import("mongoose").Document<unknown, {}, User> & User & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    createGoogleUser(userData: GoogleUserData): Promise<UserDocument>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    activateAccount(activateAccountDto: ActivateAccountDto): Promise<{
        message: string;
    }>;
}
