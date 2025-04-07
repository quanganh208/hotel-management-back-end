import mongoose, { HydratedDocument } from 'mongoose';
export type RoomStatusLogDocument = HydratedDocument<RoomStatusLog>;
export declare class RoomStatusLog {
    roomId: mongoose.Types.ObjectId;
    status: string;
    previousStatus: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note: string;
}
export declare const RoomStatusLogSchema: mongoose.Schema<RoomStatusLog, mongoose.Model<RoomStatusLog, any, any, any, mongoose.Document<unknown, any, RoomStatusLog> & RoomStatusLog & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, RoomStatusLog, mongoose.Document<unknown, {}, mongoose.FlatRecord<RoomStatusLog>> & mongoose.FlatRecord<RoomStatusLog> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
