import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type InventoryItemDocument = HydratedDocument<InventoryItem>;

export enum InventoryItemType {
  FOOD = 'food',
  BEVERAGE = 'beverage',
  AMENITY = 'amenity',
  SUPPLIES = 'supplies',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({
    required: true,
    unique: true,
  })
  inventoryCode: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({
    type: String,
    enum: Object.values(InventoryItemType),
    default: InventoryItemType.OTHER,
  })
  itemType: string;

  @Prop()
  image: string;

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true })
  hotelId: mongoose.Types.ObjectId;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);
