import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum InvoiceStatus {
  OPEN = 'open',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  ROOM = 'room',
  SERVICE = 'service',
}

export enum ItemType {
  ROOM = 1,
  INVENTORY = 2,
}

export class InvoiceItem {
  @ApiProperty({
    description: 'ID của mặt hàng hoặc dịch vụ',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  itemId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tên mặt hàng hoặc dịch vụ',
    example: 'Nước suối',
  })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    description: 'Mã hàng hóa (nếu có)',
    example: 'SP00001',
  })
  @Prop()
  itemCode?: string;

  @ApiProperty({
    description: 'Loại (sản phẩm từ kho hoặc dịch vụ)',
    example: 'inventory',
    enum: ['inventory', 'service'],
  })
  @Prop({ required: true, enum: ['inventory', 'service'] })
  type: string;

  @ApiProperty({
    description: 'Loại mặt hàng (1: Phòng, 2: Hàng hóa)',
    example: 2,
    enum: ItemType,
  })
  @Prop({ required: false, enum: ItemType })
  itemType?: ItemType;

  @ApiProperty({
    description: 'Số lượng',
    example: 2,
  })
  @Prop({ required: true, min: 1 })
  quantity: number;

  @ApiProperty({
    description: 'Đơn giá',
    example: 15000,
  })
  @Prop({ required: true, min: 0 })
  price: number;

  @ApiProperty({
    description: 'Thành tiền (số lượng x đơn giá)',
    example: 30000,
  })
  @Prop({ required: true, min: 0 })
  amount: number;

  @ApiProperty({
    description: 'Ghi chú cho mặt hàng',
    example: 'Yêu cầu thêm đá',
  })
  @Prop()
  note?: string;
}

export type InvoiceDocument = Invoice & Document;

@Schema({
  timestamps: true,
  collection: 'invoices',
})
export class Invoice {
  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Mã hóa đơn',
    example: 'HD000001',
  })
  @Prop({ required: true, unique: true })
  invoiceCode: string;

  @ApiProperty({
    description: 'Loại hóa đơn (phòng hoặc dịch vụ lẻ)',
    example: 'room',
    enum: InvoiceType,
  })
  @Prop({ required: true, enum: InvoiceType, default: InvoiceType.ROOM })
  invoiceType: InvoiceType;

  @ApiProperty({
    description: 'ID của phòng (optional cho hóa đơn dịch vụ lẻ)',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  roomId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'ID của đặt phòng (optional)',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  bookingId?: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tên khách hàng',
    example: 'Nguyễn Văn A',
  })
  @Prop({ required: true })
  customerName: string;

  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0987654321',
  })
  @Prop()
  customerPhone?: string;

  @ApiProperty({
    description: 'Địa chỉ khách hàng',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @Prop()
  customerAddress?: string;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Khách hàng VIP',
  })
  @Prop()
  note?: string;

  @ApiProperty({
    description: 'Ngày check-in (cho hóa đơn phòng)',
    example: '2023-01-01T14:00:00.000Z',
  })
  @Prop()
  checkInDate?: Date;

  @ApiProperty({
    description: 'Ngày check-out (cho hóa đơn phòng)',
    example: '2023-01-03T12:00:00.000Z',
  })
  @Prop()
  checkOutDate?: Date;

  @ApiProperty({
    description: 'Danh sách các mặt hàng/dịch vụ',
    type: [InvoiceItem],
  })
  @Prop({ type: [Object], default: [] })
  items: InvoiceItem[];

  @ApiProperty({
    description: 'Tổng tiền hóa đơn',
    example: 1500000,
  })
  @Prop({ default: 0 })
  totalAmount: number;

  @ApiProperty({
    description: 'Giảm giá (nếu có)',
    example: 50000,
  })
  @Prop({ default: 0 })
  discount: number;

  @ApiProperty({
    description: 'Số tiền phải thanh toán',
    example: 1450000,
  })
  @Prop({ default: 0 })
  finalAmount: number;

  @ApiProperty({
    description: 'Trạng thái hóa đơn',
    example: 'open',
    enum: InvoiceStatus,
  })
  @Prop({ required: true, enum: InvoiceStatus, default: InvoiceStatus.OPEN })
  status: InvoiceStatus;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    example: 'CASH',
    enum: ['CASH', 'BANK_TRANSFER'],
  })
  @Prop()
  paymentMethod?: string;

  @ApiProperty({
    description: 'Mã giao dịch/tham chiếu thanh toán',
    example: 'TXN123456789',
  })
  @Prop()
  paymentReference?: string;

  @ApiProperty({
    description: 'Ghi chú thanh toán',
    example: 'Thanh toán đầy đủ',
  })
  @Prop()
  paymentNote?: string;

  @ApiProperty({
    description: 'Ngày thanh toán',
    example: '2023-01-03T12:30:00.000Z',
  })
  @Prop()
  paidDate?: Date;

  @ApiProperty({
    description: 'ID của người tạo hóa đơn',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  createdBy: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'ID của người cập nhật hóa đơn cuối cùng',
    example: '60d21b4667d0d8992e610c85',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  updatedBy?: mongoose.Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
