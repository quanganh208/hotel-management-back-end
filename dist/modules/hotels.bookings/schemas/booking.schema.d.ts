import mongoose, { HydratedDocument } from 'mongoose';
export type BookingDocument = HydratedDocument<Booking>;
export declare class Booking {
    roomId: mongoose.Types.ObjectId;
    checkInDate: Date;
    checkOutDate: Date;
    guestName: string;
    phoneNumber: string;
    createdBy: mongoose.Types.ObjectId;
}
export declare const BookingSchema: mongoose.Schema<Booking, mongoose.Model<Booking, any, any, any, mongoose.Document<unknown, any, Booking> & Booking & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Booking, mongoose.Document<unknown, {}, mongoose.FlatRecord<Booking>> & mongoose.FlatRecord<Booking> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
