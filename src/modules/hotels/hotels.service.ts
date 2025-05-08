import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from './schemas/hotel.schema';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PopulatedHotel, PopulatedUser } from '@/types/mongoose.types';
import { hashPassword } from '@/helpers/util';

// Type guard để kiểm tra đối tượng có _id
function hasMongoId(obj: unknown): obj is { _id: Types.ObjectId | string } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    '_id' in obj &&
    (typeof obj._id === 'string' || obj._id instanceof Types.ObjectId)
  );
}

// Type guard để kiểm tra đối tượng có phương thức toString
function hasToString(obj: unknown): obj is { toString(): string } {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  // Kiểm tra một cách an toàn xem obj có thuộc tính toString hay không
  const hasToStringProperty = 'toString' in obj;

  // Nếu có thuộc tính toString, kiểm tra xem đó có phải là function hay không
  if (hasToStringProperty) {
    const toStringProperty = (obj as Record<string, unknown>)['toString'];
    return typeof toStringProperty === 'function';
  }

  return false;
}

// Định nghĩa kiểu cho đối tượng có _id
interface WithId {
  _id: Types.ObjectId | string;
  [key: string]: any;
}

// Định nghĩa kiểu cho đối tượng có toString
interface WithToString {
  toString(): string;
  [key: string]: any;
}

// Định nghĩa kiểu cho đối tượng hotel có thể chưa populate hoặc đã populate
interface HotelWithOwner {
  owner: string | WithId | WithToString;
  staff?: Array<string | WithId | WithToString>;
  [key: string]: any;
}

@Injectable()
export class HotelsService {
  constructor(
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createHotelDto: CreateHotelDto, userId: string): Promise<Hotel> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Tạo nhân viên ChatBot AI tự động
    const chatbotUser = await this.createChatbotUser(createHotelDto.name);

    // Thêm chatbot vào danh sách nhân viên
    const staffList = createHotelDto.staff || [];
    staffList.push(chatbotUser._id.toString());

    const newHotel = new this.hotelModel({
      ...createHotelDto,
      owner: userId,
      staff: staffList,
    });

    const savedHotel = await newHotel.save();

    // Cập nhật thông tin khách sạn cho chatbot
    await this.userModel.findByIdAndUpdate(chatbotUser._id, {
      $push: { hotels: savedHotel._id },
    });

    await this.userModel.findByIdAndUpdate(userId, {
      $push: { hotels: savedHotel._id },
    });

    if (staffList.length > 0) {
      await this.userModel.updateMany(
        { _id: { $in: staffList } },
        { $push: { hotels: savedHotel._id } },
      );
    }

    return savedHotel;
  }

  // Tạo tài khoản ChatBot AI
  private async createChatbotUser(hotelName: string): Promise<UserDocument> {
    // Kiểm tra xem đã có chatbot chưa
    const existingChatbot = await this.userModel.findOne({
      email: 'chatbot@gmail.com',
      name: 'ChatBot AI',
    });

    if (existingChatbot) {
      return existingChatbot;
    }

    // Tạo mật khẩu ngẫu nhiên cho chatbot
    const password = Math.random().toString(36).slice(-10);
    const hashedPassword = await hashPassword(password);

    // Tạo mã nhân viên cho chatbot
    const employeeCode = 'AI000001';

    // Tạo tài khoản chatbot
    const chatbot = new this.userModel({
      email: 'chatbot@gmail.com',
      password: hashedPassword,
      name: 'ChatBot AI',
      role: 'RECEPTIONIST',
      isVerified: true,
      accountType: 'LOCAL',
      employeeCode: employeeCode,
      note: `Trợ lý ảo tự động tạo cho khách sạn ${hotelName}`,
      image: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
    });

    return await chatbot.save();
  }

  // Hàm helper để chuyển đổi document thành PopulatedHotel an toàn
  private toPopulatedHotel(doc: HotelDocument): PopulatedHotel {
    const hotelObj = doc.toObject();

    // Sử dụng ép kiểu qua unknown
    const typedOwner = hotelObj.owner as unknown as
      | PopulatedUser
      | Types.ObjectId;
    const typedStaff = hotelObj.staff as unknown as (
      | PopulatedUser
      | Types.ObjectId
    )[];

    // Tái tạo đối tượng theo đúng định nghĩa PopulatedHotel
    const populatedHotel: Omit<Hotel, 'owner' | 'staff'> & {
      owner: PopulatedUser | Types.ObjectId;
      staff: (PopulatedUser | Types.ObjectId)[];
    } = {
      ...hotelObj,
      owner: typedOwner,
      staff: typedStaff,
    };

    return populatedHotel as PopulatedHotel;
  }

  async findOne(id: string): Promise<PopulatedHotel> {
    if (id === 'owner' || id === 'staff' || id.length !== 24) {
      throw new NotFoundException('ID khách sạn không hợp lệ');
    }

    const hotel = await this.hotelModel
      .findById(id)
      .populate('owner', 'name email image')
      .populate('staff', 'name email image')
      .exec();

    if (!hotel) {
      throw new NotFoundException('Khách sạn không tồn tại');
    }

    return this.toPopulatedHotel(hotel);
  }

  async findByOwner(userId: string): Promise<PopulatedHotel[]> {
    const hotels = await this.hotelModel
      .find({ owner: userId })
      .populate('owner', 'name email image')
      .populate('staff', 'name email image')
      .exec();

    return hotels.map((hotel) => this.toPopulatedHotel(hotel));
  }

  async findByStaff(userId: string): Promise<PopulatedHotel[]> {
    const hotels = await this.hotelModel
      .find({ staff: userId })
      .populate('owner', 'name email image')
      .populate('staff', 'name email image')
      .exec();

    return hotels.map((hotel) => this.toPopulatedHotel(hotel));
  }

  extractOwnerId(hotel: HotelWithOwner): string {
    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn');
    }

    const { owner } = hotel;

    // Xử lý trường hợp owner là string
    if (typeof owner === 'string') {
      return owner;
    }

    // Xử lý trường hợp owner là object có _id
    if (hasMongoId(owner)) {
      return owner._id.toString();
    }

    // Trường hợp là object có toString
    if (hasToString(owner)) {
      return owner.toString();
    }

    throw new NotFoundException('Dữ liệu khách sạn không hợp lệ');
  }

  isUserStaffMember(hotel: HotelWithOwner, userId: string): boolean {
    if (!hotel || !userId || !hotel.staff || !Array.isArray(hotel.staff)) {
      return false;
    }

    return hotel.staff.some((staffMember) => {
      // Nếu staffMember là string
      if (typeof staffMember === 'string') {
        return staffMember === userId;
      }

      // Nếu staffMember là object có _id
      if (hasMongoId(staffMember)) {
        return staffMember._id.toString() === userId;
      }

      // Nếu staffMember là object có toString
      if (hasToString(staffMember)) {
        return staffMember.toString() === userId;
      }

      return false;
    });
  }
}
