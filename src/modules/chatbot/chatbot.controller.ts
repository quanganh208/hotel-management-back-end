import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateChatSessionDto, SendMessageDto } from './dto/chat-message.dto';
import { ApiOperation, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Chat } from './schemas/chat.schema';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động của chatbot' })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái hoạt động của chatbot',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'online',
          description: 'Trạng thái của chatbot',
        },
        version: {
          type: 'string',
          example: '1.0.0',
          description: 'Phiên bản của chatbot',
        },
        apiProvider: {
          type: 'string',
          example: 'Google Gemini',
          description: 'Nhà cung cấp API AI',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2023-07-15T08:30:45.123Z',
          description: 'Thời gian kiểm tra',
        },
      },
    },
  })
  async getStatus() {
    return {
      status: 'online',
      version: '1.0.0',
      apiProvider: 'Google Gemini',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Tạo đoạn chat mới' })
  @ApiResponse({
    status: 201,
    description: 'Đoạn chat đã được tạo thành công',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '60d5ec9af682fbd12a0b4b72',
          description: 'ID của cuộc trò chuyện',
        },
        userId: {
          type: 'string',
          example: '60d5ec9af682fbd12a0b4b72',
          description: 'ID của người dùng (nếu có)',
        },
        userName: {
          type: 'string',
          example: 'Nguyễn Văn A',
          description: 'Tên của người dùng',
        },
        hotelId: {
          type: 'string',
          example: '60d5ec9af682fbd12a0b4b73',
          description: 'ID của khách sạn',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2023-07-15T08:30:30.123Z',
          description: 'Thời gian tạo đoạn chat',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2023-07-15T08:30:30.123Z',
          description: 'Thời gian cập nhật gần nhất',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async createChatSession(@Body() createChatSessionDto: CreateChatSessionDto) {
    return this.chatbotService.createChatSession(createChatSessionDto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Gửi tin nhắn đến chatbot' })
  @ApiResponse({
    status: 201,
    description: 'Tin nhắn đã được gửi và nhận phản hồi thành công',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '60d5ec9af682fbd12a0b4b72',
          description: 'ID của cuộc trò chuyện',
        },
        message: {
          type: 'string',
          example:
            'Xin chào! Khách sạn chúng tôi có các món ăn như: Mì xào hải sản (120.000đ/phần), Cơm rang thập cẩm (85.000đ/phần), và Sandwich gà (65.000đ/phần). Bạn có muốn đặt món nào không?',
          description: 'Nội dung phản hồi từ chatbot',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2023-07-15T08:30:45.123Z',
          description: 'Thời gian phản hồi',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đoạn chat' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.chatbotService.sendMessage(sendMessageDto);
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Lấy lịch sử chat' })
  @ApiParam({
    name: 'id',
    description: 'ID của cuộc trò chuyện',
    type: 'string',
    example: '60d5ec9af682fbd12a0b4b72',
  })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử chat được tìm thấy',
    type: Chat,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc trò chuyện' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getChatHistory(@Param('id') id: string) {
    return this.chatbotService.getChatHistory(id);
  }

  @Get('by-hotel/:hotelId')
  @ApiOperation({ summary: 'Lấy danh sách chat theo khách sạn' })
  @ApiParam({
    name: 'hotelId',
    description: 'ID của khách sạn',
    type: 'string',
    example: '60d5ec9af682fbd12a0b4b73',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách chat của khách sạn',
    type: [Chat],
  })
  @ApiResponse({ status: 400, description: 'ID khách sạn không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getChatsByHotel(@Param('hotelId') hotelId: string) {
    return this.chatbotService.getChatsByHotel(hotelId);
  }
}
