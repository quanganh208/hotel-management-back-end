import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';

export type RoomBedTypeDocument = HydratedDocument<RoomBedType>;

@Schema({ timestamps: true })
export class RoomBedType {
  @Prop()
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: mongoose.Schema.Types.ObjectId;
}

export const RoomBedTypeSchema = SchemaFactory.createForClass(RoomBedType);
