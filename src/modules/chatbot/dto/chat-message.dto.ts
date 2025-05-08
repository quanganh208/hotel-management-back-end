import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageRole } from '../schemas/chat.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    enum: MessageRole,
    description: 'Vai trò của người gửi tin nhắn (user hoặc assistant)',
    example: 'user',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(MessageRole)
  role: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Tôi muốn đặt phòng cho 2 người vào cuối tuần này',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class CreateChatSessionDto {
  @ApiPropertyOptional({
    description: 'ID của người dùng (nếu đã đăng nhập)',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiProperty({
    description: 'ID của khách sạn mà khách hàng đang tương tác',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @IsNotEmpty()
  @IsString()
  hotelId: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID của đoạn chat',
    example: '60d5ec9af682fbd12a0b4b74',
  })
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn gửi đến chatbot',
    example: 'Tôi muốn đặt phòng cho 2 người vào cuối tuần này',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  id: string;

  @ApiProperty({
    description: 'Nội dung phản hồi từ chatbot',
    example:
      'Xin chào! Tôi rất vui được hỗ trợ bạn đặt phòng. Để tôi giúp bạn tìm phòng phù hợp cho 2 người vào cuối tuần này, bạn có thể cho tôi biết ngày cụ thể bạn muốn check-in và check-out không?',
  })
  message: string;

  @ApiProperty({
    description: 'Thời gian phản hồi',
    example: '2023-07-15T08:30:45.123Z',
  })
  timestamp: Date;
}

export class ChatSessionDto {
  @ApiProperty({
    description: 'ID của cuộc trò chuyện',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'ID của người dùng (nếu đã đăng nhập)',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  userId?: string;

  @ApiProperty({
    description: 'Tên của người dùng',
    example: 'Nguyễn Văn A',
  })
  userName: string;

  @ApiProperty({
    description: 'ID của khách sạn',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  hotelId: string;

  @ApiProperty({
    description: 'Thời gian tạo đoạn chat',
    example: '2023-07-15T08:30:30.123Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật gần nhất',
    example: '2023-07-15T08:30:45.123Z',
  })
  updatedAt: Date;
}
