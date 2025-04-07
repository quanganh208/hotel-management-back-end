import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import mongoose from 'mongoose';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatusLogsService } from './room-status-logs.service';
import { CreateRoomStatusLogDto } from './dto/create-room-status-log.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private roomTypesService: RoomTypesService,
    private roomStatusLogsService: RoomStatusLogsService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Kiểm tra xem roomType có tồn tại không
    await this.roomTypesService.findOne(createRoomDto.roomTypeId);

    const newRoom = new this.roomModel(createRoomDto);
    const savedRoom = await newRoom.save();

    // Thêm room vào roomType
    await this.roomTypesService.addRoomToRoomType(
      createRoomDto.roomTypeId,
      savedRoom._id,
    );

    return savedRoom;
  }

  async findAll(hotelId: mongoose.Types.ObjectId): Promise<Room[]> {
    return this.roomModel.find({ hotelId }).populate('roomTypeId').exec();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<Room> {
    const room = await this.roomModel
      .findById(id)
      .populate('roomTypeId')
      .exec();
    if (!room) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }
    return room;
  }

  async findByHotelId(hotelId: mongoose.Types.ObjectId): Promise<Room[]> {
    return this.roomModel.find({ hotelId }).populate('roomTypeId').exec();
  }

  async findByRoomTypeId(roomTypeId: mongoose.Types.ObjectId): Promise<Room[]> {
    return this.roomModel.find({ roomTypeId }).populate('roomTypeId').exec();
  }

  async update(
    id: mongoose.Types.ObjectId,
    updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    // Nếu đang thay đổi roomTypeId, cần kiểm tra roomTypeId mới có tồn tại không
    if (updateRoomDto.roomTypeId) {
      await this.roomTypesService.findOne(updateRoomDto.roomTypeId);
    }

    const existingRoom = await this.findOne(id);
    const oldRoomTypeId =
      existingRoom.roomTypeId as unknown as mongoose.Types.ObjectId;

    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { $set: updateRoomDto }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Nếu đã thay đổi roomTypeId
    if (
      updateRoomDto.roomTypeId &&
      oldRoomTypeId.toString() !== updateRoomDto.roomTypeId.toString()
    ) {
      // Xóa room khỏi roomType cũ
      await this.roomTypesService.removeRoomFromRoomType(oldRoomTypeId, id);

      // Thêm room vào roomType mới
      await this.roomTypesService.addRoomToRoomType(
        updateRoomDto.roomTypeId,
        id,
      );
    }

    return updatedRoom;
  }

  async updateStatus(
    id: mongoose.Types.ObjectId,
    status: string,
    userId: mongoose.Types.ObjectId,
    note?: string,
  ): Promise<Room> {
    // Lấy thông tin phòng hiện tại để ghi log trạng thái trước đó
    const currentRoom = await this.findOne(id);
    const previousStatus = currentRoom.status;

    // Cập nhật trạng thái mới
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('roomTypeId');

    if (!updatedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }

    // Lưu log thay đổi trạng thái
    const logDto: CreateRoomStatusLogDto = {
      roomId: id,
      status: status as RoomStatus,
      previousStatus: previousStatus as RoomStatus,
      changedBy: userId,
      note: note,
    };

    await this.roomStatusLogsService.create(logDto);

    return updatedRoom;
  }

  async remove(id: mongoose.Types.ObjectId): Promise<Room> {
    const room = await this.findOne(id);

    // Xóa room khỏi roomType
    await this.roomTypesService.removeRoomFromRoomType(
      room.roomTypeId as unknown as mongoose.Types.ObjectId,
      id,
    );

    const deletedRoom = await this.roomModel.findByIdAndDelete(id);
    if (!deletedRoom) {
      throw new NotFoundException(
        `Phòng với ID ${id.toString()} không tìm thấy`,
      );
    }
    return deletedRoom;
  }
}
