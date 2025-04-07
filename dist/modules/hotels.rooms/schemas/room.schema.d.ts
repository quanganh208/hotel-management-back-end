import mongoose, { HydratedDocument } from 'mongoose';
import { RoomType } from '../../hotels.room-types/schemas/room-type.schema';
export type RoomDocument = HydratedDocument<Room>;
export declare enum RoomStatus {
    AVAILABLE = "available",
    OCCUPIED = "occupied",
    BOOKED = "booked",
    CHECKED_IN = "checked_in",
    CHECKED_OUT = "checked_out",
    CLEANING = "cleaning",
    MAINTENANCE = "maintenance",
    OUT_OF_SERVICE = "out_of_service",
    RESERVED = "reserved"
}
export declare class Room {
    hotelId: mongoose.Types.ObjectId;
    roomNumber: string;
    roomTypeId: RoomType;
    floor: string;
    status: string;
    image: string;
    note: string;
    bookings: mongoose.Types.ObjectId[];
}
export declare const RoomSchema: mongoose.Schema<Room, mongoose.Model<Room, any, any, any, mongoose.Document<unknown, any, Room> & Room & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Room, mongoose.Document<unknown, {}, mongoose.FlatRecord<Room>> & mongoose.FlatRecord<Room> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
