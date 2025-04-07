import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { RoomStatus } from './room.schema';

export type RoomStatusLogDocument = HydratedDocument<RoomStatusLog>;

@Schema({ timestamps: true })
export class RoomStatusLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true })
  roomId: mongoose.Types.ObjectId;

  @Prop({ enum: RoomStatus, required: true })
  status: string;

  @Prop({ enum: RoomStatus })
  previousStatus: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  changedBy: mongoose.Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  changedAt: Date;

  @Prop()
  note: string;
}

export const RoomStatusLogSchema = SchemaFactory.createForClass(RoomStatusLog);
