import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';
import { RoomBedType } from '@/modules/room.bed_types/schemas/room.bed_type.schema';
import { RoomFloor } from '@/modules/room.floors/schemas/room.floor.schema';
import { RoomFacility } from '@/modules/room.facilities/schemas/room.facility.schema';
import { RoomStatus } from '@/modules/room.statuses/schemas/room.status.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: RoomBedType.name })
  bedType: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: RoomFloor.name })
  roomFloor: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: RoomFacility.name })
  roomFacility: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: RoomStatus.name })
  roomStatus: mongoose.Schema.Types.ObjectId;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
