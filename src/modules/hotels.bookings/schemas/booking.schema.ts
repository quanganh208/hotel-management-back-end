import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true })
  roomId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  checkInDate: Date;

  @Prop({ required: true })
  checkOutDate: Date;

  @Prop({ required: true })
  guestName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, default: 1 })
  guestCount: number;

  @Prop({ required: false })
  note?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongoose.Types.ObjectId;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
