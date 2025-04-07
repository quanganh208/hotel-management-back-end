import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from './schemas/hotel.schema';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { PopulatedHotel } from '@/types/mongoose.types';
interface WithId {
    _id: Types.ObjectId | string;
    [key: string]: any;
}
interface WithToString {
    toString(): string;
    [key: string]: any;
}
interface HotelWithOwner {
    owner: string | WithId | WithToString;
    staff?: Array<string | WithId | WithToString>;
    [key: string]: any;
}
export declare class HotelsService {
    private hotelModel;
    private userModel;
    constructor(hotelModel: Model<HotelDocument>, userModel: Model<UserDocument>);
    create(createHotelDto: CreateHotelDto, userId: string): Promise<Hotel>;
    private toPopulatedHotel;
    findOne(id: string): Promise<PopulatedHotel>;
    findByOwner(userId: string): Promise<PopulatedHotel[]>;
    findByStaff(userId: string): Promise<PopulatedHotel[]>;
    extractOwnerId(hotel: HotelWithOwner): string;
    isUserStaffMember(hotel: HotelWithOwner, userId: string): boolean;
}
export {};
