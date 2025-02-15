import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';

export type RoomStatusDocument = HydratedDocument<RoomStatus>;

@Schema({ timestamps: true })
export class RoomStatus {
  @Prop()
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: mongoose.Schema.Types.ObjectId;
}

export const RoomStatusSchema = SchemaFactory.createForClass(RoomStatus);
