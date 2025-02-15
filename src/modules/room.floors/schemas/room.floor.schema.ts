import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';

export type RoomFloorDocument = HydratedDocument<RoomFloor>;

@Schema({ timestamps: true })
export class RoomFloor {
  @Prop()
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: mongoose.Schema.Types.ObjectId;
}

export const RoomFloorSchema = SchemaFactory.createForClass(RoomFloor);
