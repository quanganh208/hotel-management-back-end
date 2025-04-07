import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RoomStatusLog,
  RoomStatusLogDocument,
} from './schemas/room-status-log.schema';
import { CreateRoomStatusLogDto } from './dto/create-room-status-log.dto';
import mongoose from 'mongoose';

@Injectable()
export class RoomStatusLogsService {
  constructor(
    @InjectModel(RoomStatusLog.name)
    private roomStatusLogModel: Model<RoomStatusLogDocument>,
  ) {}

  async create(
    createRoomStatusLogDto: CreateRoomStatusLogDto,
  ): Promise<RoomStatusLog> {
    const newRoomStatusLog = new this.roomStatusLogModel({
      ...createRoomStatusLogDto,
      changedAt: new Date(),
    });
    return newRoomStatusLog.save();
  }

  async findByRoomId(
    roomId: mongoose.Types.ObjectId,
    limit = 10,
    offset = 0,
  ): Promise<RoomStatusLog[]> {
    return this.roomStatusLogModel
      .find({ roomId })
      .sort({ changedAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('changedBy', 'name email')
      .exec();
  }

  async findByHotelId(
    hotelId: mongoose.Types.ObjectId,
    limit = 10,
    offset = 0,
  ): Promise<RoomStatusLog[]> {
    // Tìm log dựa trên phòng thuộc khách sạn
    // Cần thực hiện aggregate hoặc lookup để lấy các log dựa trên hotelId
    return this.roomStatusLogModel.aggregate([
      {
        $lookup: {
          from: 'rooms', // Collection name của Room
          localField: 'roomId',
          foreignField: '_id',
          as: 'room',
        },
      },
      { $unwind: '$room' },
      { $match: { 'room.hotelId': hotelId } },
      { $sort: { changedAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]);
  }
}
