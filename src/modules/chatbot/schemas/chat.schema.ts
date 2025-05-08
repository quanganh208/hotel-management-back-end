import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '@/modules/users/schemas/user.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ChatDocument = HydratedDocument<Chat>;

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Schema({ timestamps: true })
export class ChatMessage {
  @ApiProperty({
    enum: MessageRole,
    description: 'Vai trò của người gửi tin nhắn',
    example: 'user',
  })
  @Prop({ required: true, enum: MessageRole })
  role: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Tôi muốn đặt phòng cho 2 người vào cuối tuần này',
  })
  @Prop({ required: true })
  content: string;

  @ApiProperty({
    description: 'Thời gian gửi tin nhắn',
    example: '2023-07-15T08:30:30.123Z',
  })
  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Chat {
  @ApiPropertyOptional({
    description: 'ID của người dùng (nếu đã đăng nhập)',
    type: String,
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  userId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Tên của người dùng hoặc khách',
    example: 'Nguyễn Văn A',
  })
  @Prop({ required: true, default: 'Khách' })
  userName: string;

  @ApiProperty({
    description: 'ID của khách sạn mà khách hàng đang tương tác',
    type: String,
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true })
  hotelId: mongoose.Types.ObjectId;

  @ApiProperty({
    description: 'Danh sách các tin nhắn trong cuộc trò chuyện',
    type: [ChatMessage],
  })
  @Prop({ type: [ChatMessage], default: [] })
  messages: ChatMessage[];

  @ApiProperty({
    description: 'Trạng thái cuộc trò chuyện (đang hoạt động hay không)',
    example: true,
  })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Thời gian tạo cuộc trò chuyện',
    example: '2023-07-15T08:30:30.123Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật cuộc trò chuyện gần nhất',
    example: '2023-07-15T08:30:45.123Z',
  })
  updatedAt?: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
