import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  name: string;

  @Prop()
  image: string;

  @Prop()
  googleId: string;

  @Prop({ default: 'LOCAL' })
  accountType: string;

  @Prop({ default: 'OWNER' })
  role: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationCode: string;

  @Prop()
  codeExpires: Date;

  @Prop()
  resetToken: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }] })
  hotels: mongoose.Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
