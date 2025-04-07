import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';
export type HotelDocument = HydratedDocument<Hotel>;
export declare class Hotel {
    name: string;
    address: string;
    image: string;
    owner: User;
    staff: User[];
    rooms: mongoose.Types.ObjectId[];
    inventory: mongoose.Types.ObjectId[];
    transactions: mongoose.Types.ObjectId[];
}
export declare const HotelSchema: mongoose.Schema<Hotel, mongoose.Model<Hotel, any, any, any, mongoose.Document<unknown, any, Hotel> & Hotel & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Hotel, mongoose.Document<unknown, {}, mongoose.FlatRecord<Hotel>> & mongoose.FlatRecord<Hotel> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
