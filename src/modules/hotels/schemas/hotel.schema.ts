import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';

export type HotelDocument = HydratedDocument<Hotel>;

@Schema({ timestamps: true })
export class Hotel {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  image: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  staff: User[];
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);
