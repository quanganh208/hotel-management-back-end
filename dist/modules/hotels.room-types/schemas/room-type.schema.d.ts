import mongoose, { HydratedDocument } from 'mongoose';
export type RoomTypeDocument = HydratedDocument<RoomType>;
export declare class RoomType {
    hotelId: mongoose.Types.ObjectId;
    name: string;
    pricePerHour: number;
    pricePerDay: number;
    priceOvernight: number;
    description: string;
    image: string;
    rooms: mongoose.Types.ObjectId[];
}
export declare const RoomTypeSchema: mongoose.Schema<RoomType, mongoose.Model<RoomType, any, any, any, mongoose.Document<unknown, any, RoomType> & RoomType & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, RoomType, mongoose.Document<unknown, {}, mongoose.FlatRecord<RoomType>> & mongoose.FlatRecord<RoomType> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
