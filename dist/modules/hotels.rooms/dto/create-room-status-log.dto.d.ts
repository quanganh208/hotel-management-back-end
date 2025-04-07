import mongoose from 'mongoose';
import { RoomStatus } from '../schemas/room.schema';
export declare class CreateRoomStatusLogDto {
    roomId: mongoose.Types.ObjectId;
    status: RoomStatus;
    previousStatus?: RoomStatus;
    changedBy: mongoose.Types.ObjectId;
    note?: string;
}
