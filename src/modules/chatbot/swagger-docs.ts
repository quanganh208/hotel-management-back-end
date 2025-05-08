import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Cấu hình Swagger cho module Chatbot
 */
export const chatbotSwaggerConfig = new DocumentBuilder()
  .setTitle('API Chatbot Hỗ Trợ Khách Hàng')
  .setDescription(
    `
    API chatbot này được xây dựng để hỗ trợ khách hàng với các thông tin về khách sạn, 
    đặt phòng, và tư vấn lựa chọn phòng phù hợp. Chatbot sử dụng Google Gemini API 
    để tạo ra các câu trả lời thông minh và tự nhiên.
    
    ## Tính năng
    
    1. **Hỗ trợ đặt phòng**: Chatbot có thể hỗ trợ khách hàng trong quá trình đặt phòng, 
       thu thập thông tin cần thiết như ngày check-in, check-out, số lượng khách, và loại phòng.
    
    2. **Trả lời câu hỏi**: Chatbot có thể trả lời các câu hỏi liên quan đến khách sạn, 
       tiện nghi, dịch vụ, và chính sách.
    
    3. **Tư vấn chọn phòng**: Dựa trên thông tin từ cơ sở dữ liệu, chatbot có thể đề xuất 
       loại phòng phù hợp với nhu cầu của khách hàng.
    
    4. **Cung cấp thông tin về đồ ăn và thức uống**: Chatbot có thể trả lời chi tiết các câu hỏi về 
       đồ ăn, thức uống có sẵn tại khách sạn, bao gồm giá cả, mô tả và hướng dẫn đặt hàng.
    
    5. **Thông tin về tiện nghi khách sạn**: Chatbot cung cấp thông tin đầy đủ về các tiện nghi có sẵn,
       cách sử dụng và chi phí nếu có.
    
    6. **Lưu lịch sử chat**: Hệ thống lưu trữ lịch sử chat để có thể tiếp tục cuộc hội thoại sau này.
    
    ## Hướng dẫn sử dụng API
    
    ### 1. Kiểm tra trạng thái chatbot
    
    \`\`\`
    GET /chatbot/status
    \`\`\`
    
    ### 2. Tạo đoạn chat mới
    
    \`\`\`
    POST /chatbot/sessions
    
    {
      "userId": "optional_user_id",
      "userName": "Nguyễn Văn A",
      "hotelId": "required_hotel_id"
    }
    \`\`\`
    
    ### 3. Gửi tin nhắn đến chatbot
    
    \`\`\`
    POST /chatbot/messages
    
    {
      "chatId": "required_chat_id",
      "message": "Tôi muốn đặt phòng cho 2 người vào cuối tuần này"
    }
    \`\`\`
    
    ### 4. Lấy lịch sử chat
    
    \`\`\`
    GET /chatbot/history/:id
    \`\`\`

    ### 5. Lấy danh sách chat theo khách sạn
    
    \`\`\`
    GET /chatbot/by-hotel/:hotelId
    \`\`\`
  `,
  )
  .setVersion('1.0')
  .addTag('chatbot', 'API liên quan đến chatbot hỗ trợ khách hàng')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Nhập JWT token của bạn',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();

/**
 * Các ví dụ về request và response cho API chatbot
 */
export const chatbotApiExamples = {
  getStatus: {
    response: {
      status: 'online',
      version: '1.0.0',
      apiProvider: 'Google Gemini',
      timestamp: '2023-07-15T08:30:45.123Z',
    },
  },
  createChatSession: {
    request: {
      userId: '60d5ec9af682fbd12a0b4b72',
      userName: 'Nguyễn Văn A',
      hotelId: '60d5ec9af682fbd12a0b4b73',
    },
    response: {
      id: '60d5ec9af682fbd12a0b4b74',
      userId: '60d5ec9af682fbd12a0b4b72',
      userName: 'Nguyễn Văn A',
      hotelId: '60d5ec9af682fbd12a0b4b73',
      createdAt: '2023-07-15T08:30:30.123Z',
      updatedAt: '2023-07-15T08:30:30.123Z',
    },
  },
  sendMessage: {
    request: {
      chatId: '60d5ec9af682fbd12a0b4b74',
      message: 'Tôi hơi đói, có gì ăn không?',
    },
    response: {
      id: '60d5ec9af682fbd12a0b4b74',
      message:
        'Xin chào! Khách sạn chúng tôi có các món ăn như: Mì xào hải sản (120.000đ/phần), Cơm rang thập cẩm (85.000đ/phần), và Sandwich gà (65.000đ/phần). Bạn có muốn đặt món nào không? Để đặt món, bạn có thể gọi dịch vụ phòng hoặc đặt qua ứng dụng của khách sạn.',
      timestamp: '2023-07-15T08:30:45.123Z',
    },
  },
  sendMessageBeverage: {
    request: {
      chatId: '60d5ec9af682fbd12a0b4b74',
      message: 'Khách sạn có những loại đồ uống nào?',
    },
    response: {
      id: '60d5ec9af682fbd12a0b4b74',
      message:
        'Khách sạn chúng tôi có các loại đồ uống sau: Nước ép cam tươi (45.000đ/ly), Sinh tố bơ (55.000đ/ly), Cà phê đen (35.000đ/ly), Trà hoa cúc (30.000đ/ly), và các loại bia, rượu vang. Đồ uống có thể được phục vụ tại phòng hoặc tại nhà hàng/quầy bar của khách sạn.',
      timestamp: '2023-07-15T08:31:15.123Z',
    },
  },
  sendMessageAmenity: {
    request: {
      chatId: '60d5ec9af682fbd12a0b4b74',
      message: 'Khách sạn có những tiện nghi gì?',
    },
    response: {
      id: '60d5ec9af682fbd12a0b4b74',
      message:
        'Khách sạn chúng tôi cung cấp nhiều tiện nghi như: Dịch vụ spa (350.000đ/60 phút), Phòng gym miễn phí cho khách lưu trú, Hồ bơi ngoài trời, Dịch vụ giặt ủi (80.000đ/kg), và Bộ đồ dùng phòng tắm cao cấp. Để sử dụng các dịch vụ này, bạn có thể liên hệ lễ tân hoặc gọi dịch vụ phòng.',
      timestamp: '2023-07-15T08:32:00.123Z',
    },
  },
  getChatHistory: {
    response: {
      _id: '60d5ec9af682fbd12a0b4b74',
      userId: '60d5ec9af682fbd12a0b4b72',
      userName: 'Nguyễn Văn A',
      hotelId: '60d5ec9af682fbd12a0b4b73',
      messages: [
        {
          role: 'user',
          content: 'Tôi hơi đói, có gì ăn không?',
          timestamp: '2023-07-15T08:30:30.123Z',
        },
        {
          role: 'assistant',
          content:
            'Xin chào! Khách sạn chúng tôi có các món ăn như: Mì xào hải sản (120.000đ/phần), Cơm rang thập cẩm (85.000đ/phần), và Sandwich gà (65.000đ/phần). Bạn có muốn đặt món nào không? Để đặt món, bạn có thể gọi dịch vụ phòng hoặc đặt qua ứng dụng của khách sạn.',
          timestamp: '2023-07-15T08:30:45.123Z',
        },
        {
          role: 'user',
          content: 'Khách sạn có những loại đồ uống nào?',
          timestamp: '2023-07-15T08:31:00.123Z',
        },
        {
          role: 'assistant',
          content:
            'Khách sạn chúng tôi có các loại đồ uống sau: Nước ép cam tươi (45.000đ/ly), Sinh tố bơ (55.000đ/ly), Cà phê đen (35.000đ/ly), Trà hoa cúc (30.000đ/ly), và các loại bia, rượu vang. Đồ uống có thể được phục vụ tại phòng hoặc tại nhà hàng/quầy bar của khách sạn.',
          timestamp: '2023-07-15T08:31:15.123Z',
        },
      ],
      isActive: true,
      createdAt: '2023-07-15T08:30:30.123Z',
      updatedAt: '2023-07-15T08:31:15.123Z',
    },
  },
};
