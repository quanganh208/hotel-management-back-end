import { Model } from 'mongoose';
import { RoomType, RoomTypeDocument } from './schemas/room-type.schema';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import mongoose from 'mongoose';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
export declare class RoomTypesService {
    private roomTypeModel;
    constructor(roomTypeModel: Model<RoomTypeDocument>);
    create(createRoomTypeDto: CreateRoomTypeDto): Promise<RoomType>;
    findAll(hotelId: mongoose.Types.ObjectId): Promise<RoomType[]>;
    findOne(id: mongoose.Types.ObjectId): Promise<RoomType>;
    findByHotelId(hotelId: mongoose.Types.ObjectId): Promise<RoomType[]>;
    update(id: mongoose.Types.ObjectId, updateRoomTypeDto: UpdateRoomTypeDto): Promise<RoomType>;
    remove(id: mongoose.Types.ObjectId): Promise<RoomType>;
    addRoomToRoomType(roomTypeId: mongoose.Types.ObjectId, roomId: mongoose.Types.ObjectId): Promise<RoomType>;
    removeRoomFromRoomType(roomTypeId: mongoose.Types.ObjectId, roomId: mongoose.Types.ObjectId): Promise<RoomType>;
}
