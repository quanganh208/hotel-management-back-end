import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import mongoose from 'mongoose';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatusLogsService } from './room-status-logs.service';
export declare class RoomsService {
    private roomModel;
    private roomTypesService;
    private roomStatusLogsService;
    constructor(roomModel: Model<RoomDocument>, roomTypesService: RoomTypesService, roomStatusLogsService: RoomStatusLogsService);
    create(createRoomDto: CreateRoomDto): Promise<Room>;
    findAll(hotelId: mongoose.Types.ObjectId): Promise<Room[]>;
    findOne(id: mongoose.Types.ObjectId): Promise<Room>;
    findByHotelId(hotelId: mongoose.Types.ObjectId): Promise<Room[]>;
    findByRoomTypeId(roomTypeId: mongoose.Types.ObjectId): Promise<Room[]>;
    update(id: mongoose.Types.ObjectId, updateRoomDto: UpdateRoomDto): Promise<Room>;
    updateStatus(id: mongoose.Types.ObjectId, status: string, userId: mongoose.Types.ObjectId, note?: string): Promise<Room>;
    remove(id: mongoose.Types.ObjectId): Promise<Room>;
}
