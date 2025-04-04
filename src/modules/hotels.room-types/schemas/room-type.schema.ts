import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type RoomTypeDocument = HydratedDocument<RoomType>;

@Schema({ timestamps: true })
export class RoomType {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true })
  hotelId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  pricePerHour: number;

  @Prop({ required: true })
  pricePerDay: number;

  @Prop({ required: true })
  priceOvernight: number;

  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }] })
  rooms: mongoose.Types.ObjectId[];
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
