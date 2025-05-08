import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, MessageRole } from './schemas/chat.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatMessageDto,
  ChatResponseDto,
  ChatSessionDto,
  CreateChatSessionDto,
  SendMessageDto,
} from './dto/chat-message.dto';
import { HotelsService } from '../hotels/hotels.service';
import { RoomsService } from '../hotels.rooms/rooms.service';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import { BookingsService } from '../hotels.bookings/bookings.service';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { InventoryService } from '../hotels.inventory/inventory.service';
import { InventoryItemType } from '../hotels.inventory/schemas/inventory-item.schema';
import { RoomStatus } from '../hotels.rooms/schemas/room.schema';
import { BookingStatus } from '../hotels.bookings/schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Hotel, HotelDocument } from '../hotels/schemas/hotel.schema';
import { hashPassword } from '@/helpers/util';

@Injectable()
export class ChatbotService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private systemPrompt: string;
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    private hotelsService: HotelsService,
    private roomsService: RoomsService,
    private roomTypesService: RoomTypesService,
    private bookingsService: BookingsService,
    private configService: ConfigService,
    private inventoryService: InventoryService,
  ) {
    // Khởi tạo Gemini API
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') || 'dummy-key';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
    });

    // Tạo system prompt
    this.systemPrompt = `Bạn là trợ lý ảo của khách sạn, nhiệm vụ của bạn là giúp đỡ khách hàng với các thông tin về khách sạn, 
    các loại phòng, giá cả, và hỗ trợ đặt phòng. Hãy trả lời thân thiện, ngắn gọn và chính xác.
    Bạn có thể truy cập thông tin về khách sạn, phòng, đặt phòng và các dịch vụ, hàng hóa có sẵn từ cơ sở dữ liệu.
    Khi khách hỏi về đặt phòng, hãy hướng dẫn họ về quy trình đặt phòng và thu thập thông tin cần thiết.
    Khi khách hỏi về đồ ăn, thức uống hoặc các tiện nghi khác, hãy cung cấp thông tin chi tiết về các mặt hàng có sẵn trong khách sạn,
    bao gồm tên, giá cả, mô tả và hướng dẫn cách đặt hàng.
    Hãy luôn giới thiệu các dịch vụ và hàng hóa phù hợp với nhu cầu của khách.
    `;
  }

  async createChatSession(
    createChatSessionDto: CreateChatSessionDto,
  ): Promise<ChatSessionDto> {
    const { userId, userName, hotelId } = createChatSessionDto;

    // Tạo chat mới
    const newChat = new this.chatModel({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      userName: userName,
      hotelId: new mongoose.Types.ObjectId(hotelId),
      messages: [],
      isActive: true,
    });

    // Lưu chat
    const savedChat = await newChat.save();

    return {
      id: savedChat._id.toString(),
      userId: userId,
      userName: savedChat.userName,
      hotelId: hotelId,
      createdAt: savedChat.createdAt || new Date(),
      updatedAt: savedChat.updatedAt || new Date(),
    };
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<ChatResponseDto> {
    const { chatId, message } = sendMessageDto;

    // Tìm đoạn chat theo ID
    const chat = await this.chatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundException(`Không tìm thấy đoạn chat với ID ${chatId}`);
    }

    // Thêm tin nhắn của người dùng
    chat.messages.push({
      role: MessageRole.USER,
      content: message,
      timestamp: new Date(),
    });

    // Lấy thông tin từ database để tạo context
    const context = await this.buildDatabaseContext(chat.hotelId.toString());

    // Gửi tin nhắn đến Gemini API
    const response = await this.generateResponse(chat.messages, context);

    // Thêm phản hồi từ chatbot
    chat.messages.push({
      role: MessageRole.ASSISTANT,
      content: response,
      timestamp: new Date(),
    });

    // Cập nhật trạng thái chat
    chat.updatedAt = new Date();
    await chat.save();

    return {
      id: chat._id.toString(),
      message: response,
      timestamp: new Date(),
    };
  }

  async getChatHistory(chatId: string): Promise<Chat | null> {
    return this.chatModel.findById(chatId).exec();
  }

  async getChatsByHotel(hotelId: string): Promise<Chat[]> {
    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    return this.chatModel
      .find({ hotelId: hotelObjectId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  private async generateResponse(
    messages: ChatMessageDto[],
    context: string,
  ): Promise<string> {
    try {
      // Tạo history cho Gemini API
      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Lấy tin nhắn mới nhất của người dùng
      const userMessage = messages[messages.length - 1].content;

      // Phân tích nội dung tin nhắn để xác định chủ đề
      const messageTopics = this.analyzeMessageTopic(userMessage);

      // Kiểm tra xem người dùng có đang xác nhận đặt phòng không
      const isConfirmingBooking = this.isConfirmingBooking(
        userMessage,
        messages,
      );

      // Nếu người dùng đang xác nhận đặt phòng, xử lý đặt phòng
      if (isConfirmingBooking) {
        // Lấy hotelId từ đối tượng chat
        const chat = await this.chatModel.findOne({
          messages: { $elemMatch: { content: messages[0].content } },
        });
        if (chat && chat.hotelId) {
          try {
            const bookingResult = await this.processBookingRequest(
              messages,
              chat.hotelId.toString(),
            );
            return bookingResult;
          } catch (error) {
            this.logger.error('Lỗi khi xử lý đặt phòng:', error);
            return 'Xin lỗi, đã xảy ra lỗi khi xử lý đặt phòng của bạn. Vui lòng thử lại sau hoặc liên hệ trực tiếp với lễ tân.';
          }
        }
      }

      // Tạo chat với Gemini
      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      // Tạo prompt với context
      let prompt = `${this.systemPrompt}
      
      Thông tin về khách sạn, phòng và dịch vụ:
      ${context}
      
      Tin nhắn của khách hàng: ${userMessage}`;

      // Thêm hướng dẫn cụ thể dựa trên chủ đề tin nhắn
      if (messageTopics.includes('food')) {
        prompt +=
          '\nKhách đang hỏi về đồ ăn. Hãy cung cấp thông tin chi tiết về các món ăn có sẵn, giá cả và cách đặt.';
      } else if (messageTopics.includes('beverage')) {
        prompt +=
          '\nKhách đang hỏi về đồ uống. Hãy cung cấp thông tin chi tiết về các loại đồ uống có sẵn, giá cả và cách đặt.';
      } else if (messageTopics.includes('amenity')) {
        prompt +=
          '\nKhách đang hỏi về tiện nghi. Hãy cung cấp thông tin chi tiết về các tiện nghi có sẵn, giá cả và cách yêu cầu.';
      } else if (messageTopics.includes('room_image')) {
        prompt +=
          '\nKhách đang hỏi về hình ảnh phòng. Nếu có thông tin về đường dẫn ảnh phòng, hãy cung cấp đường dẫn đó và mô tả phòng chi tiết. Nếu không có ảnh, hãy giải thích rằng bạn không thể hiển thị trực tiếp ảnh nhưng có thể cung cấp đường dẫn để xem ảnh trên website hoặc mô tả chi tiết về phòng.';
      } else if (messageTopics.includes('booking')) {
        // Phân tích thông tin đặt phòng
        const bookingInfo = this.extractBookingInfo(userMessage);

        let bookingContext = '\nKhách đang yêu cầu đặt phòng. ';

        if (bookingInfo.checkInDate) {
          const checkInDate =
            bookingInfo.checkInDate.toLocaleDateString('vi-VN');
          const checkInTime = bookingInfo.checkInDate.toLocaleTimeString(
            'vi-VN',
            { hour: '2-digit', minute: '2-digit' },
          );
          bookingContext += `Ngày check-in: ${checkInDate} lúc ${checkInTime}. `;
        }

        if (bookingInfo.duration) {
          bookingContext += `Thời gian lưu trú: ${bookingInfo.duration} ngày. `;
        }

        if (bookingInfo.checkOutDate) {
          const checkOutDate =
            bookingInfo.checkOutDate.toLocaleDateString('vi-VN');
          const checkOutTime = bookingInfo.checkOutDate.toLocaleTimeString(
            'vi-VN',
            { hour: '2-digit', minute: '2-digit' },
          );
          bookingContext += `Ngày check-out: ${checkOutDate} lúc ${checkOutTime}. `;
        }

        if (bookingInfo.guestName) {
          bookingContext += `Tên khách: ${bookingInfo.guestName}. `;
        }

        if (bookingInfo.phoneNumber) {
          bookingContext += `Số điện thoại: ${bookingInfo.phoneNumber}. `;
        }

        if (bookingInfo.roomType) {
          bookingContext += `Loại phòng yêu cầu: ${bookingInfo.roomType}. `;
        }

        if (bookingInfo.guestCount) {
          bookingContext += `Số lượng khách: ${bookingInfo.guestCount} người. `;
        }

        bookingContext += `
        
        Hướng dẫn đặc biệt: 
        1. Nếu khách cung cấp thời gian lưu trú (số ngày) và ngày check-in, hãy tự động tính ngày check-out và xác nhận lại với khách.
        2. Nếu khách chưa cung cấp đủ thông tin, hãy nhẹ nhàng hỏi thêm những thông tin còn thiếu.
        3. Luôn xác nhận lại thông tin đặt phòng với khách trước khi tiến hành các bước tiếp theo.
        4. Nếu khách đã cung cấp đủ thông tin cần thiết, hãy xác nhận và hướng dẫn họ các bước tiếp theo.
        5. Khi khách xác nhận đặt phòng, hãy hỏi họ "Bạn có muốn xác nhận đặt phòng với thông tin trên không?" để họ có thể trả lời "có" hoặc "không".`;

        prompt += bookingContext;
      }

      // Gửi prompt đến Gemini API
      const result = await chat.sendMessage(prompt);
      const response = result.response.text();

      return response;
    } catch (error) {
      this.logger.error('Lỗi khi gọi Gemini API:', error);
      return 'Xin lỗi, hiện tại tôi không thể trả lời câu hỏi của bạn. Vui lòng thử lại sau.';
    }
  }

  // Kiểm tra xem người dùng có đang xác nhận đặt phòng không
  private isConfirmingBooking(
    message: string,
    chatHistory: ChatMessageDto[],
  ): boolean {
    const lowerMessage = message.toLowerCase();
    const confirmationKeywords = [
      'xác nhận đặt phòng',
      'đồng ý đặt',
      'đặt luôn',
      'đặt ngay',
      'ok đặt phòng',
      'đồng ý',
      'xác nhận',
      'chắc chắn',
      'đặt phòng đi',
      'có, tôi muốn đặt',
      'có',
      'đúng',
      'chính xác',
    ];

    // Kiểm tra xem tin nhắn hiện tại có chứa từ khóa xác nhận không
    const isConfirming = confirmationKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );

    // Kiểm tra xem tin nhắn trước đó của chatbot có hỏi về xác nhận đặt phòng không
    let previousBotAskedForConfirmation = false;

    if (chatHistory.length >= 2) {
      const previousBotMessage = chatHistory[chatHistory.length - 2];
      if (previousBotMessage.role === MessageRole.ASSISTANT) {
        const botMessageLower = previousBotMessage.content.toLowerCase();
        previousBotAskedForConfirmation =
          botMessageLower.includes('xác nhận đặt phòng') ||
          botMessageLower.includes('muốn đặt phòng') ||
          botMessageLower.includes('xác nhận thông tin');
      }
    }

    return isConfirming && previousBotAskedForConfirmation;
  }

  // Trích xuất thông tin đặt phòng từ lịch sử chat
  private extractBookingInfoFromChatHistory(messages: ChatMessageDto[]): {
    checkInDate?: Date;
    checkOutDate?: Date;
    duration?: number;
    guestName?: string;
    phoneNumber?: string;
    roomType?: string;
    guestCount?: number;
  } {
    const combinedInfo: {
      checkInDate?: Date;
      checkOutDate?: Date;
      duration?: number;
      guestName?: string;
      phoneNumber?: string;
      roomType?: string;
      guestCount?: number;
    } = {
      checkInDate: undefined,
      checkOutDate: undefined,
      duration: undefined,
      guestName: undefined,
      phoneNumber: undefined,
      roomType: undefined,
      guestCount: undefined,
    };

    // Duyệt qua tất cả tin nhắn của người dùng để tìm thông tin
    for (const message of messages) {
      if (message.role === MessageRole.USER) {
        const messageInfo = this.extractBookingInfo(message.content);

        // Cập nhật thông tin nếu tìm thấy
        if (messageInfo.checkInDate && !combinedInfo.checkInDate) {
          combinedInfo.checkInDate = messageInfo.checkInDate;
        }

        if (messageInfo.checkOutDate && !combinedInfo.checkOutDate) {
          combinedInfo.checkOutDate = messageInfo.checkOutDate;
        }

        if (messageInfo.duration && !combinedInfo.duration) {
          combinedInfo.duration = messageInfo.duration;
        }

        if (messageInfo.guestName && !combinedInfo.guestName) {
          combinedInfo.guestName = messageInfo.guestName;
        }

        if (messageInfo.phoneNumber && !combinedInfo.phoneNumber) {
          combinedInfo.phoneNumber = messageInfo.phoneNumber;
        }

        if (messageInfo.roomType && !combinedInfo.roomType) {
          combinedInfo.roomType = messageInfo.roomType;
        }

        if (messageInfo.guestCount && !combinedInfo.guestCount) {
          combinedInfo.guestCount = messageInfo.guestCount;
        }
      }
    }

    // Nếu có thời gian lưu trú và ngày check-in nhưng không có ngày check-out, tính ngày check-out
    if (
      combinedInfo.checkInDate &&
      combinedInfo.duration &&
      !combinedInfo.checkOutDate
    ) {
      const checkOutDate = new Date(combinedInfo.checkInDate);
      checkOutDate.setDate(
        combinedInfo.checkInDate.getDate() + combinedInfo.duration,
      );
      checkOutDate.setHours(12, 0, 0, 0); // Check-out lúc 12h trưa
      combinedInfo.checkOutDate = checkOutDate;
    }

    return combinedInfo;
  }

  // Phương thức phân tích thông tin đặt phòng
  private extractBookingInfo(message: string): {
    checkInDate?: Date;
    checkOutDate?: Date;
    duration?: number;
    guestName?: string;
    phoneNumber?: string;
    roomType?: string;
    guestCount?: number;
  } {
    const info: {
      checkInDate?: Date;
      checkOutDate?: Date;
      duration?: number;
      guestName?: string;
      phoneNumber?: string;
      roomType?: string;
      guestCount?: number;
    } = {};

    const lowerMessage = message.toLowerCase();

    // Tìm thông tin về thời gian lưu trú
    const durationRegexes = [
      /(\d+)\s*ngày/i,
      /(\d+)\s*đêm/i,
      /(\d+)\s*hôm/i,
      /(\d+)\s*day/i,
      /(\d+)\s*night/i,
    ];

    for (const regex of durationRegexes) {
      const match = message.match(regex);
      if (match && match[1]) {
        info.duration = parseInt(match[1], 10);
        break;
      }
    }

    // Tìm thông tin về ngày check-in
    const dateRegexes = [
      // DD/MM/YYYY format
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // Ngày DD tháng MM format
      /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})/i,
      // DD/MM format (giả định năm hiện tại)
      /(\d{1,2})[\/\-](\d{1,2})/,
    ];

    const timeRegex = /(\d{1,2})[h:.](\d{0,2})/;

    for (const regex of dateRegexes) {
      const match = message.match(regex);
      if (match) {
        let day, month, year;

        if (match.length === 4) {
          // DD/MM/YYYY format
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
          year = parseInt(match[3], 10);
        } else if (match.length === 3) {
          // DD/MM format or "ngày DD tháng MM"
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
          year = new Date().getFullYear();
        }

        if (day && month !== undefined) {
          const timeMatch = message.match(timeRegex);
          let hours = 14; // Default check-in time
          let minutes = 0;

          if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
          }

          info.checkInDate = new Date(year, month, day, hours, minutes);
          break;
        }
      }
    }

    // Tính ngày check-out dựa trên duration nếu có
    if (info.checkInDate && info.duration) {
      info.checkOutDate = new Date(info.checkInDate);
      info.checkOutDate.setDate(info.checkInDate.getDate() + info.duration);
      // Mặc định check-out lúc 12h trưa
      info.checkOutDate.setHours(12, 0, 0, 0);
    }

    // Tìm tên khách
    const nameRegex = /tên\s+(?:là|:)?\s+([A-Za-z\sÀ-ỹ]+)(?:,|\.|$|\s+\d)/i;
    const nameMatch = message.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
      info.guestName = nameMatch[1].trim();
    }

    // Tìm số điện thoại
    const phoneRegex =
      /(?:số điện thoại|sđt|phone|tel|số)(?:\s+(?:là|:))?\s*(\d{9,11})/i;
    const phoneMatch = message.match(phoneRegex);
    if (phoneMatch && phoneMatch[1]) {
      info.phoneNumber = phoneMatch[1].trim();
    }

    // Tìm loại phòng (không sử dụng regex cứng, chỉ trích xuất từ khóa)
    const roomTypeRegex = /phòng\s+([a-zA-ZÀ-ỹ\s]+)(?:,|\.|$|\s+\d)/i;
    const roomTypeMatch = message.match(roomTypeRegex);
    if (roomTypeMatch && roomTypeMatch[1]) {
      info.roomType = roomTypeMatch[1].trim();
    }

    // Tìm số lượng khách
    const guestCountRegex = /(\d+)\s*(?:người|khách|nguoi|khach|guest)/i;
    const guestMatch = message.match(guestCountRegex);
    if (guestMatch && guestMatch[1]) {
      info.guestCount = parseInt(guestMatch[1], 10);
    }

    return info;
  }

  // Xử lý yêu cầu đặt phòng
  private async processBookingRequest(
    messages: ChatMessageDto[],
    hotelId: string,
  ): Promise<string> {
    try {
      // Phân tích lịch sử tin nhắn để lấy thông tin đặt phòng
      const bookingInfo = this.extractBookingInfoFromChatHistory(messages);

      if (!bookingInfo.checkInDate || !bookingInfo.checkOutDate) {
        return 'Xin lỗi, tôi không thể xác định thời gian check-in hoặc check-out từ thông tin bạn cung cấp. Vui lòng cung cấp thông tin chi tiết hơn.';
      }

      if (!bookingInfo.guestName) {
        return 'Xin lỗi, tôi cần biết tên của bạn để đặt phòng. Vui lòng cung cấp tên của bạn.';
      }

      if (!bookingInfo.phoneNumber) {
        return 'Xin lỗi, tôi cần số điện thoại của bạn để đặt phòng. Vui lòng cung cấp số điện thoại của bạn.';
      }

      // Tìm phòng phù hợp với yêu cầu
      const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
      const availableRooms =
        await this.roomsService.findByHotelId(hotelObjectId);
      const roomsFiltered = availableRooms.filter(
        (room) => room.status === RoomStatus.AVAILABLE,
      );

      if (roomsFiltered.length === 0) {
        return 'Xin lỗi, hiện tại không có phòng trống nào phù hợp với yêu cầu của bạn. Vui lòng thử lại vào thời gian khác hoặc liên hệ trực tiếp với lễ tân để được hỗ trợ.';
      }

      // Lấy tất cả loại phòng từ database
      // const roomTypes = await this.roomTypesService.findAll(hotelObjectId); // Không dùng trực tiếp ở đây nữa

      // Tìm phòng phù hợp với loại phòng yêu cầu (nếu có)
      let selectedRoom = roomsFiltered[0];
      if (bookingInfo.roomType) {
        const roomTypeMatches = roomsFiltered.filter((room) => {
          const roomType = room.roomTypeId as any;
          if (!roomType || !roomType.name) return false;

          // So sánh tên loại phòng từ database với yêu cầu của người dùng
          return roomType.name
            .toLowerCase()
            .includes(bookingInfo.roomType?.toLowerCase() || '');
        });

        if (roomTypeMatches.length > 0) {
          selectedRoom = roomTypeMatches[0];
        }
      }

      // Tính tổng thời gian lưu trú theo ngày
      const checkIn = new Date(bookingInfo.checkInDate);
      const checkOut = new Date(bookingInfo.checkOutDate);
      const durationInMillis = checkOut.getTime() - checkIn.getTime();
      const durationInDays = Math.ceil(
        durationInMillis / (1000 * 60 * 60 * 24),
      );

      // Lấy thông tin loại phòng để tính giá
      const roomType = selectedRoom.roomTypeId as any;
      const pricePerDay = roomType.pricePerDay || 0;
      const totalPrice = pricePerDay * durationInDays;

      // Tìm ChatBot AI trong danh sách nhân viên của khách sạn
      const chatbot = await this.findChatbotUser(hotelId);
      if (!chatbot) {
        this.logger.error(
          `Không thể tìm hoặc tạo người dùng ChatBot AI cho khách sạn ID: ${hotelId}. Không thể tiến hành đặt phòng.`,
        );
        return 'Xin lỗi, đã xảy ra lỗi nội bộ khi xử lý yêu cầu đặt phòng của bạn. Vui lòng thử lại sau hoặc liên hệ trực tiếp với lễ tân.';
      }
      const chatbotId = chatbot._id.toString();

      // Tạo đối tượng đặt phòng
      const bookingData = {
        roomId: (selectedRoom as any)._id.toString(),
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        guestName: bookingInfo.guestName,
        phoneNumber: bookingInfo.phoneNumber,
        status: BookingStatus.PENDING,
        guestCount: bookingInfo.guestCount || 1,
        createdBy: chatbotId,
      };

      // Gọi service để tạo đặt phòng
      const booking = await this.bookingsService.create(bookingData);

      // Cập nhật trạng thái phòng
      const updateStatusDto = {
        status: RoomStatus.BOOKED,
        note: 'Đặt phòng qua chatbot',
      };

      await this.roomsService.updateStatus(
        new mongoose.Types.ObjectId((selectedRoom as any)._id.toString()),
        updateStatusDto,
        chatbotId,
      );

      // Tạo phản hồi cho người dùng
      return `Đặt phòng thành công! 
      
Thông tin đặt phòng của bạn:
- Tên: ${bookingInfo.guestName}
- Số điện thoại: ${bookingInfo.phoneNumber}
- Phòng số: ${selectedRoom.roomNumber}, Tầng: ${selectedRoom.floor}
- Loại phòng: ${roomType.name}
- Check-in: ${checkIn.toLocaleDateString('vi-VN')} lúc ${checkIn.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
- Check-out: ${checkOut.toLocaleDateString('vi-VN')} lúc ${checkOut.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
- Thời gian lưu trú: ${durationInDays} ngày
- Tổng giá: ${totalPrice.toLocaleString('vi-VN')}đ

Mã đặt phòng của bạn là: ${(booking as any)._id}
Vui lòng lưu lại mã này để check-in và các yêu cầu khác.

Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`;
    } catch (error) {
      this.logger.error('Lỗi khi xử lý đặt phòng:', error);
      return 'Xin lỗi, đã xảy ra lỗi khi xử lý đặt phòng của bạn. Vui lòng thử lại sau hoặc liên hệ trực tiếp với lễ tân.';
    }
  }

  // Tìm user ChatBot AI
  private async findChatbotUser(hotelId: string): Promise<UserDocument | null> {
    const chatbotEmail = 'chatbot@gmail.com';
    const chatbotName = 'ChatBot AI';
    const logger = this.logger;

    try {
      const hotel = await this.hotelsService.findOne(hotelId);
      if (!hotel) {
        logger.error(`Hotel not found with ID: ${hotelId} in findChatbotUser.`);
        return null;
      }

      // Check if chatbot is already a staff member (PopulatedUser)
      if (hotel.staff && hotel.staff.length > 0) {
        for (const staffMember of hotel.staff) {
          // staffMember can be PopulatedUser or Types.ObjectId
          // hotelsService.findOne populates 'staff', 'name email image'
          if (
            staffMember &&
            typeof staffMember === 'object' &&
            '_id' in staffMember
          ) {
            const staffUser = staffMember as any; // Cast to access name/email
            if (
              staffUser.name === chatbotName &&
              staffUser.email === chatbotEmail
            ) {
              logger.log(
                `Found chatbot user ${staffUser._id} in staff for hotel ${hotelId}.`,
              );
              // Return the full UserDocument
              return await this.userModel.findById(staffUser._id).exec();
            }
          }
        }
      }

      // Chatbot not found in staff list by direct check, try to find/create globally and link
      let chatbotUser = await this.userModel.findOne({
        email: chatbotEmail,
        name: chatbotName,
      });

      if (!chatbotUser) {
        // Chatbot user does not exist globally, create it
        logger.log(
          `Chatbot user not found globally for hotel ${hotelId}. Creating new one.`,
        );
        const password = Math.random().toString(36).slice(-10);
        const hashedPassword = await hashPassword(password);
        const employeeCode = 'AI000001';
        const hotelNameForNote = hotel.name || 'không xác định';

        chatbotUser = new this.userModel({
          email: chatbotEmail,
          password: hashedPassword,
          name: chatbotName,
          role: 'RECEPTIONIST',
          isVerified: true,
          accountType: 'LOCAL',
          employeeCode: employeeCode,
          note: `Trợ lý ảo tự động tạo cho khách sạn ${hotelNameForNote}`,
          image: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
          hotels: [new mongoose.Types.ObjectId(hotelId)],
        });
        await chatbotUser.save();
        logger.log(
          `New chatbot user created with ID: ${chatbotUser._id} for hotel ${hotelId}`,
        );

        // Add new chatbot to hotel's staff list
        await this.hotelModel.findByIdAndUpdate(hotelId, {
          $addToSet: { staff: chatbotUser._id },
        });
        logger.log(
          `Added new chatbot user ${chatbotUser._id} to staff of hotel ${hotelId}`,
        );
      } else {
        // Chatbot user exists globally, ensure it's linked to this hotel
        logger.log(
          `Found existing global chatbot user ${chatbotUser._id}. Ensuring linkage to hotel ${hotelId}.`,
        );

        // Ensure hotelId is in chatbotUser.hotels
        const isHotelLinkedToUser = chatbotUser.hotels?.some(
          (hId) => hId.toString() === hotelId,
        );
        if (!isHotelLinkedToUser) {
          await this.userModel.findByIdAndUpdate(chatbotUser._id, {
            $addToSet: { hotels: new mongoose.Types.ObjectId(hotelId) },
          });
          logger.log(
            `Linked existing chatbot user ${chatbotUser._id} to hotel ${hotelId} in user's hotels list.`,
          );
        }

        // Ensure chatbotUser._id is in hotel.staff
        // We need to fetch the hotel again or use the hotelModel to check staff as hotel.staff might be PopulatedUser
        const currentHotelDoc = await this.hotelModel
          .findById(hotelId)
          .select('staff')
          .lean();
        const isUserInHotelStaff = currentHotelDoc?.staff
          ?.map((id) => id.toString())
          .includes(chatbotUser._id.toString());

        if (!isUserInHotelStaff) {
          await this.hotelModel.findByIdAndUpdate(hotelId, {
            $addToSet: { staff: chatbotUser._id },
          });
          logger.log(
            `Added existing chatbot user ${chatbotUser._id} to staff of hotel ${hotelId}.`,
          );
        }
      }
      return chatbotUser;
    } catch (error: any) {
      logger.error('Error in findChatbotUser:', error.message, error.stack);
      return null;
    }
  }

  // Phương thức phân tích chủ đề tin nhắn
  private analyzeMessageTopic(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Từ khóa liên quan đến đồ ăn
    const foodKeywords = [
      'ăn',
      'đồ ăn',
      'món ăn',
      'thức ăn',
      'bữa ăn',
      'đói',
      'đặt đồ ăn',
      'menu',
      'thực đơn',
    ];
    // Từ khóa liên quan đến đồ uống
    const beverageKeywords = [
      'uống',
      'đồ uống',
      'nước',
      'bia',
      'rượu',
      'cà phê',
      'trà',
      'nước ngọt',
      'khát',
    ];
    // Từ khóa liên quan đến tiện nghi
    const amenityKeywords = [
      'tiện nghi',
      'dịch vụ',
      'spa',
      'gym',
      'hồ bơi',
      'bể bơi',
      'massage',
      'giặt ủi',
      'đồ dùng',
    ];

    // Từ khóa liên quan đến hình ảnh phòng
    const roomImageKeywords = [
      'ảnh',
      'hình',
      'hình ảnh',
      'xem phòng',
      'xem ảnh',
      'xem hình',
      'trông như thế nào',
      'nhìn như thế nào',
      'nhìn ra sao',
      'trông ra sao',
      'hình dáng',
    ];

    // Từ khóa liên quan đến đặt phòng
    const bookingKeywords = [
      'đặt phòng',
      'book phòng',
      'thuê phòng',
      'muốn ở',
      'muốn đặt',
      'đặt một phòng',
      'đặt 1 phòng',
      'check-in',
      'checkin',
    ];

    // Kiểm tra từ khóa
    if (foodKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push('food');
    }

    if (beverageKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push('beverage');
    }

    if (amenityKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push('amenity');
    }

    if (roomImageKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push('room_image');
    }

    if (bookingKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push('booking');
    }

    return topics;
  }

  private async buildDatabaseContext(hotelId: string): Promise<string> {
    try {
      const hotelObjectId = new mongoose.Types.ObjectId(hotelId);

      // Lấy thông tin về khách sạn
      const hotel = await this.hotelsService.findOne(hotelId);

      // Lấy thông tin về loại phòng
      const roomTypes = await this.roomTypesService.findAll(hotelObjectId);

      // Lấy thông tin về phòng có sẵn
      const rooms = await this.roomsService.findByHotelId(hotelObjectId);
      const availableRooms = rooms.filter(
        (room) => room.status === 'available',
      );

      // Lấy thông tin về hàng hóa
      const inventoryItems = await this.inventoryService.findAll(hotelObjectId);

      // Phân loại hàng hóa
      const foodItems = inventoryItems.filter(
        (item) => item.itemType === InventoryItemType.FOOD && item.stock > 0,
      );
      const beverageItems = inventoryItems.filter(
        (item) =>
          item.itemType === InventoryItemType.BEVERAGE && item.stock > 0,
      );
      const amenityItems = inventoryItems.filter(
        (item) => item.itemType === InventoryItemType.AMENITY && item.stock > 0,
      );

      // Tạo context từ dữ liệu
      let context = 'Thông tin khách sạn:\n';

      if (hotel) {
        context += `- Khách sạn: ${hotel.name}, Địa chỉ: ${hotel.address}\n`;
      } else {
        context += `- Khách sạn: Không tìm thấy thông tin khách sạn\n`;
      }

      context += '\nCác loại phòng:\n';
      if (roomTypes && roomTypes.length > 0) {
        roomTypes.forEach((type) => {
          context += `- Loại phòng: ${type.name}, Giá theo giờ: ${type.pricePerHour}đ, Giá theo ngày: ${type.pricePerDay}đ, Giá qua đêm: ${type.priceOvernight}đ\n`;
          context += `  Mô tả: ${type.description || 'Không có mô tả'}\n`;
          // Thêm thông tin về ảnh phòng
          if (type.image) {
            context += `  Ảnh phòng: ${type.image}\n`;
          }
          // Thêm các thông tin khác nếu có
          try {
            // Sử dụng any để truy cập các thuộc tính có thể không tồn tại trong interface
            const typeAny = type as any;
            if (
              typeAny.amenities &&
              Array.isArray(typeAny.amenities) &&
              typeAny.amenities.length > 0
            ) {
              context += `  Tiện nghi: ${typeAny.amenities.join(', ')}\n`;
            }
            if (typeAny.capacity) {
              context += `  Sức chứa: ${typeAny.capacity} người\n`;
            }
          } catch (error) {
            // Bỏ qua lỗi nếu có
          }
        });
      } else {
        context += '- Không có thông tin về loại phòng\n';
      }

      context += '\nPhòng có sẵn:\n';
      if (availableRooms && availableRooms.length > 0) {
        availableRooms.forEach((room) => {
          const roomType = room.roomTypeId as any;
          context += `- Phòng số ${room.roomNumber}, Tầng: ${room.floor}, Loại: ${roomType.name}\n`;

          // Sử dụng any để truy cập các thuộc tính có thể không tồn tại trong interface
          try {
            const roomAny = room as any;
            // Thêm thông tin về ảnh phòng cụ thể nếu có
            if (roomAny.image) {
              context += `  Ảnh phòng: ${roomAny.image}\n`;
            } else if (roomType.image) {
              context += `  Ảnh phòng (loại phòng): ${roomType.image}\n`;
            }
          } catch (error) {
            // Bỏ qua lỗi nếu có
          }
        });
      } else {
        context += '- Hiện tại không có phòng trống\n';
      }

      // Thêm thông tin về đồ ăn
      context += '\nĐồ ăn có sẵn:\n';
      if (foodItems && foodItems.length > 0) {
        foodItems.forEach((item) => {
          context += `- ${item.name}: ${item.sellingPrice}đ/${item.unit}, Mô tả: ${item.description || 'Không có mô tả'}\n`;
        });
        context +=
          'Để đặt đồ ăn, khách có thể gọi dịch vụ phòng hoặc đặt qua ứng dụng của khách sạn.\n';
      } else {
        context += '- Hiện tại không có đồ ăn\n';
      }

      // Thêm thông tin về đồ uống
      context += '\nĐồ uống có sẵn:\n';
      if (beverageItems && beverageItems.length > 0) {
        beverageItems.forEach((item) => {
          context += `- ${item.name}: ${item.sellingPrice}đ/${item.unit}, Mô tả: ${item.description || 'Không có mô tả'}\n`;
        });
        context +=
          'Đồ uống có thể được phục vụ tại phòng hoặc tại nhà hàng/quầy bar của khách sạn.\n';
      } else {
        context += '- Hiện tại không có đồ uống\n';
      }

      // Thêm thông tin về tiện nghi
      context += '\nTiện nghi có sẵn:\n';
      if (amenityItems && amenityItems.length > 0) {
        amenityItems.forEach((item) => {
          context += `- ${item.name}: ${item.sellingPrice}đ/${item.unit}, Mô tả: ${item.description || 'Không có mô tả'}\n`;
        });
        context +=
          'Khách có thể yêu cầu tiện nghi bổ sung bằng cách liên hệ lễ tân hoặc dịch vụ phòng.\n';
      } else {
        context += '- Hiện tại không có tiện nghi bổ sung\n';
      }

      // Thêm thông tin về quy trình đặt phòng
      context += '\nQuy trình đặt phòng:\n';
      context += '1. Chọn loại phòng phù hợp\n';
      context += '2. Cung cấp thông tin ngày check-in và check-out\n';
      context += '3. Cung cấp số lượng khách\n';
      context += '4. Cung cấp tên và số điện thoại\n';
      context += '5. Xác nhận thông tin đặt phòng\n';

      return context;
    } catch (error) {
      this.logger.error('Lỗi khi lấy dữ liệu từ database:', error);
      return 'Không thể lấy thông tin từ cơ sở dữ liệu.';
    }
  }
}
