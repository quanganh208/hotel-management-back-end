import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import mongoose from 'mongoose';
import { RoomsService } from '../hotels.rooms/rooms.service';
import { HotelsService } from '../hotels/hotels.service';
import { RequestWithUser } from '@/types/express';
import { BookingsService } from './bookings.service';
import { Booking } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly roomsService: RoomsService,
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đặt phòng mới' })
  @ApiResponse({
    status: 201,
    description: 'Đặt phòng thành công.',
  })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    // Kiểm tra xem phòng thuộc khách sạn nào
    const roomId = new mongoose.Types.ObjectId(createBookingDto.roomId);
    const room = await this.roomsService.findOne(roomId);

    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    // Chỉ OWNER hoặc STAFF của khách sạn mới có thể tạo đặt phòng
    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền đặt phòng tại khách sạn này',
      );
    }

    return this.bookingsService.create({
      ...createBookingDto,
      createdBy: req.user.userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đặt phòng theo khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đặt phòng.',
  })
  async findAll(
    @Query('hotelId') hotelId: string,
    @Request() req: RequestWithUser,
  ): Promise<Booking[]> {
    // Kiểm tra quyền truy cập khách sạn
    const hotel = await this.hotelsService.findOne(hotelId);

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu đặt phòng của khách sạn này',
      );
    }

    return this.bookingsService.findByHotelId(
      new mongoose.Types.ObjectId(hotelId),
    );
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Lấy danh sách đặt phòng theo phòng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đặt phòng theo phòng.',
  })
  async findByRoomId(
    @Param('roomId') roomId: string,
    @Request() req: RequestWithUser,
  ): Promise<Booking[]> {
    // Kiểm tra xem phòng thuộc khách sạn nào
    const roomObjectId = new mongoose.Types.ObjectId(roomId);
    const room = await this.roomsService.findOne(roomObjectId);

    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu đặt phòng của khách sạn này',
      );
    }

    return this.bookingsService.findByRoomId(roomObjectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đặt phòng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin đặt phòng.',
  })
  @ApiResponse({ status: 404, description: 'Đặt phòng không tồn tại.' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    const objectId = new mongoose.Types.ObjectId(id);
    const booking = await this.bookingsService.findOne(objectId);

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đặt phòng');
    }

    // Lấy thông tin về phòng để biết nó thuộc khách sạn nào
    const room = await this.roomsService.findOne(
      new mongoose.Types.ObjectId(booking.roomId),
    );
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin đặt phòng này',
      );
    }

    return booking;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đặt phòng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật đặt phòng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Đặt phòng không tồn tại.' })
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    const objectId = new mongoose.Types.ObjectId(id);
    const booking = await this.bookingsService.findOne(objectId);

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đặt phòng');
    }

    // Lấy thông tin về phòng để biết nó thuộc khách sạn nào
    const room = await this.roomsService.findOne(
      new mongoose.Types.ObjectId(booking.roomId),
    );
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin đặt phòng này',
      );
    }

    return this.bookingsService.update(objectId, updateBookingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy đặt phòng' })
  @ApiResponse({
    status: 200,
    description: 'Hủy đặt phòng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Đặt phòng không tồn tại.' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Booking> {
    const objectId = new mongoose.Types.ObjectId(id);
    const booking = await this.bookingsService.findOne(objectId);

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đặt phòng');
    }

    // Lấy thông tin về phòng để biết nó thuộc khách sạn nào
    const room = await this.roomsService.findOne(
      new mongoose.Types.ObjectId(booking.roomId),
    );
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Bạn không có quyền hủy đặt phòng này');
    }

    return this.bookingsService.remove(objectId);
  }
}
