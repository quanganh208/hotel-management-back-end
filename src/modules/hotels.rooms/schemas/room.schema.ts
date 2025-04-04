import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { RoomType } from '../../hotels.room-types/schemas/room-type.schema';

export type RoomDocument = HydratedDocument<Room>;

export enum RoomStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
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

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }] })
  bookings: mongoose.Types.ObjectId[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
