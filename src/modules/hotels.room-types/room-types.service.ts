import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoomType, RoomTypeDocument } from './schemas/room-type.schema';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import mongoose from 'mongoose';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectModel(RoomType.name) private roomTypeModel: Model<RoomTypeDocument>,
  ) {}

  async create(createRoomTypeDto: CreateRoomTypeDto): Promise<RoomType> {
    const newRoomType = new this.roomTypeModel(createRoomTypeDto);
    return newRoomType.save();
  }

  async findAll(hotelId: mongoose.Types.ObjectId): Promise<RoomType[]> {
    return this.roomTypeModel.find({ hotelId }).populate('rooms').exec();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<RoomType> {
    const roomType = await this.roomTypeModel
      .findById(id)
      .populate('rooms')
      .exec();
    if (!roomType) {
      throw new NotFoundException(
        `Room type với ID ${id.toString()} không tìm thấy`,
      );
    }
    return roomType;
  }

  async findByHotelId(hotelId: mongoose.Types.ObjectId): Promise<RoomType[]> {
    return this.roomTypeModel.find({ hotelId }).populate('rooms').exec();
  }

  async update(
    id: mongoose.Types.ObjectId,
    updateRoomTypeDto: UpdateRoomTypeDto,
  ): Promise<RoomType> {
    const updatedRoomType = await this.roomTypeModel
      .findByIdAndUpdate(id, { $set: updateRoomTypeDto }, { new: true })
      .populate('rooms');

    if (!updatedRoomType) {
      throw new NotFoundException(
        `Room type với ID ${id.toString()} không tìm thấy`,
      );
    }

    return updatedRoomType;
  }

  async remove(id: mongoose.Types.ObjectId): Promise<RoomType> {
    const deletedRoomType = await this.roomTypeModel.findByIdAndDelete(id);

    if (!deletedRoomType) {
      throw new NotFoundException(
        `Room type với ID ${id.toString()} không tìm thấy`,
      );
    }

    return deletedRoomType;
  }

  async addRoomToRoomType(
    roomTypeId: mongoose.Types.ObjectId,
    roomId: mongoose.Types.ObjectId,
  ): Promise<RoomType> {
    const updatedRoomType = await this.roomTypeModel
      .findByIdAndUpdate(
        roomTypeId,
        { $push: { rooms: roomId } },
        { new: true },
      )
      .populate('rooms');

    if (!updatedRoomType) {
      throw new NotFoundException(
        `Room type với ID ${roomTypeId.toString()} không tìm thấy`,
      );
    }

    return updatedRoomType;
  }

  async removeRoomFromRoomType(
    roomTypeId: mongoose.Types.ObjectId,
    roomId: mongoose.Types.ObjectId,
  ): Promise<RoomType> {
    const updatedRoomType = await this.roomTypeModel
      .findByIdAndUpdate(
        roomTypeId,
        { $pull: { rooms: roomId } },
        { new: true },
      )
      .populate('rooms');

    if (!updatedRoomType) {
      throw new NotFoundException(
        `Room type với ID ${roomTypeId.toString()} không tìm thấy`,
      );
    }

    return updatedRoomType;
  }
}
