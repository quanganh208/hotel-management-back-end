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

  extractOwnerId(hotel: Hotel | PopulatedHotel): string | null {
    if (!hotel || !hotel.owner) return null;

    if (hotel.owner instanceof Types.ObjectId) {
      return hotel.owner.toString();
    }

    if (hasMongoId(hotel.owner)) {
      return hotel.owner._id.toString();
    }

    return null;
  }

  isUserStaffMember(hotel: Hotel | PopulatedHotel, userId: string): boolean {
    if (!hotel || !hotel.staff || !Array.isArray(hotel.staff) || !userId) {
      return false;
    }

    return hotel.staff.some((staffMember) => {
      if (staffMember instanceof Types.ObjectId) {
        return staffMember.toString() === userId;
      }

      if (hasMongoId(staffMember)) {
        return staffMember._id.toString() === userId;
      }

      return false;
    });
  }
}
