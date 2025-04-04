import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from './schemas/hotel.schema';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PopulatedHotel, hasMongoId } from '@/types/mongoose.types';

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

    const newHotel = new this.hotelModel({
      ...createHotelDto,
      owner: userId,
      staff: createHotelDto.staff || [],
    });

    const savedHotel = await newHotel.save();

    await this.userModel.findByIdAndUpdate(userId, {
      $push: { hotels: savedHotel._id },
    });

    if (createHotelDto.staff && createHotelDto.staff.length > 0) {
      await this.userModel.updateMany(
        { _id: { $in: createHotelDto.staff } },
        { $push: { hotels: savedHotel._id } },
      );
    }

    return savedHotel;
  }

  async findOne(id: string): Promise<PopulatedHotel> {
    console.log(id);
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

    return hotel as unknown as PopulatedHotel;
  }

  async findByOwner(userId: string): Promise<PopulatedHotel[]> {
    return this.hotelModel
      .find({ owner: userId })
      .populate('owner', 'name email image')
      .populate('staff', 'name email image')
      .exec() as unknown as Promise<PopulatedHotel[]>;
  }

  async findByStaff(userId: string): Promise<PopulatedHotel[]> {
    return this.hotelModel
      .find({ staff: userId })
      .populate('owner', 'name email image')
      .populate('staff', 'name email image')
      .exec() as unknown as Promise<PopulatedHotel[]>;
  }

  extractOwnerId(hotel: any): string {
    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn');
    }

    // Xử lý trường hợp owner đã được populate
    if (hotel.owner && typeof hotel.owner === 'object' && hotel.owner._id) {
      return hotel.owner._id.toString();
    }

    // Trường hợp owner chỉ là ID
    return hotel.owner?.toString();
  }

  isUserStaffMember(hotel: any, userId: string): boolean {
    if (!hotel || !userId) {
      return false;
    }

    // Kiểm tra nếu staff là mảng các ID
    if (hotel.staff && Array.isArray(hotel.staff)) {
      return hotel.staff.some((staffId) => {
        if (typeof staffId === 'string') {
          return staffId === userId;
        }

        if (staffId instanceof Types.ObjectId) {
          return staffId.toString() === userId;
        }

        if (typeof staffId === 'object' && staffId._id) {
          return staffId._id.toString() === userId;
        }

        return false;
      });
    }

    return false;
  }
}
