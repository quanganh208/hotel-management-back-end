// filepath: /Volumes/QuangAnh1TB/Coding/LTW/back-end/src/modules/hotels.inventory/schemas/inventory-check.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type InventoryCheckDocument = HydratedDocument<InventoryCheck>;
export type InventoryCheckItemDocument = HydratedDocument<InventoryCheckItem>;

export enum InventoryCheckStatus {
  DRAFT = 'draft', // Phiếu tạm
  BALANCED = 'balanced', // Đã cân bằng kho
}

@Schema({ timestamps: false })
export class InventoryCheckItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
  })
  inventoryItemId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  inventoryCode: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, default: 0 })
  systemStock: number; // Số lượng trong hệ thống

  @Prop({ required: true })
  actualStock: number; // Số lượng thực tế

  @Prop({ required: true, default: 0 })
  difference: number; // Chênh lệch (actualStock - systemStock)
}

@Schema({ timestamps: true })
export class InventoryCheck {
  @Prop({
    required: true,
    unique: true,
  })
  checkCode: string; // Mã phiếu kiểm kê (tự động tăng KK000001)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true })
  hotelId: mongoose.Types.ObjectId;

  @Prop()
  balanceDate: Date; // Ngày cân bằng (khi chuyển trạng thái sang cân bằng)

  @Prop({ default: 0 })
  totalDifference: number; // Tổng chênh lệch

  @Prop({ default: 0 })
  totalIncrease: number; // Số lượng lệch tăng

  @Prop({ default: 0 })
  totalDecrease: number; // Số lượng lệch giảm (số âm)

  @Prop()
  note: string; // Ghi chú

  @Prop({
    type: String,
    enum: Object.values(InventoryCheckStatus),
    default: InventoryCheckStatus.DRAFT,
  })
  status: string; // Trạng thái phiếu

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  createdBy: mongoose.Types.ObjectId; // Người tạo phiếu

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  balancedBy: mongoose.Types.ObjectId; // Người cân bằng kho

  @Prop({ type: [Object], default: [] })
  items: InventoryCheckItem[]; // Danh sách mặt hàng kiểm kê
}

export const InventoryCheckSchema =
  SchemaFactory.createForClass(InventoryCheck);
