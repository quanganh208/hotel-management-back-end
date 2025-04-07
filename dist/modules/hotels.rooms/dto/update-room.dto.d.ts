import mongoose from 'mongoose';
import { RoomStatus } from '../schemas/room.schema';
export declare class UpdateRoomDto {
    roomNumber?: string;
    roomTypeId?: mongoose.Types.ObjectId;
    floor?: string;
    status?: RoomStatus;
    image?: string;
    note?: string;
}
