import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export type UserRole =
  | 'OWNER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'HOUSEKEEPING'
  | 'ACCOUNTANT';

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

  @Prop()
  phoneNumber: string;

  @Prop({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender: string;

  @Prop()
  birthday: Date;

  @Prop({ default: 'LOCAL' })
  accountType: string;

  @Prop({
    default: 'OWNER',
    enum: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'],
  })
  role: UserRole;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationCode: string;

  @Prop()
  codeExpires: Date;

  @Prop()
  resetToken: string;

  // 2FA fields
  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret: string;

  @Prop()
  twoFactorBackupCodes: string[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }] })
  hotels: mongoose.Types.ObjectId[];

  @Prop()
  employeeCode: string;

  @Prop()
  note: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
