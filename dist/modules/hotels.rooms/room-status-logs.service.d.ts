import { Model } from 'mongoose';
import { RoomStatusLog, RoomStatusLogDocument } from './schemas/room-status-log.schema';
import { CreateRoomStatusLogDto } from './dto/create-room-status-log.dto';
import mongoose from 'mongoose';
export declare class RoomStatusLogsService {
    private roomStatusLogModel;
    constructor(roomStatusLogModel: Model<RoomStatusLogDocument>);
    create(createRoomStatusLogDto: CreateRoomStatusLogDto): Promise<RoomStatusLog>;
    findByRoomId(roomId: mongoose.Types.ObjectId, limit?: number, offset?: number): Promise<RoomStatusLog[]>;
    findByHotelId(hotelId: mongoose.Types.ObjectId, limit?: number, offset?: number): Promise<RoomStatusLog[]>;
}
