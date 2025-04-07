import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { RoomType } from '../../hotels.room-types/schemas/room-type.schema';

export type RoomDocument = HydratedDocument<Room>;

export enum RoomStatus {
  AVAILABLE = 'available', // Phòng sẵn sàng cho thuê
  OCCUPIED = 'occupied', // Đang có khách ở
  BOOKED = 'booked', // Đã được đặt trước nhưng khách chưa đến
  CHECKED_IN = 'checked_in', // Khách đã nhận phòng (check-in)
  CHECKED_OUT = 'checked_out', // Khách đã trả phòng (check-out), chờ dọn
  CLEANING = 'cleaning', // Phòng đang được dọn dẹp
  MAINTENANCE = 'maintenance', // Phòng đang sửa chữa, không thể sử dụng
  OUT_OF_SERVICE = 'out_of_service', // Phòng tạm ngừng sử dụng
  RESERVED = 'reserved', // Được giữ trước (booking nội bộ, khách VIP, v.v.)
}

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true })
  hotelId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  roomNumber: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true,
  })
  roomTypeId: RoomType;

  @Prop()
  floor: string;

  @Prop({ enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: string;

  @Prop()
  image: string;

  @Prop()
  note: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }] })
  bookings: mongoose.Types.ObjectId[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
