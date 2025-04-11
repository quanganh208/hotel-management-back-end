import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
  forwardRef,
  UseGuards,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { Hotel } from './schemas/hotel.schema';
import { RequestWithUser } from '@/types/express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { UploadInterceptor } from '@/helpers/upload.interceptor';
import mongoose from 'mongoose';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import { RoomsService } from '../hotels.rooms/rooms.service';
import { PopulatedHotel } from '@/types/mongoose.types';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';

@ApiTags('hotels')
@ApiBearerAuth()
@Controller('hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelsController {
  constructor(
    private readonly hotelsService: HotelsService,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly roomTypesService: RoomTypesService,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
  ) {}

  @Post()
  @Roles('OWNER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({ summary: 'Tạo khách sạn mới (Chỉ OWNER)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo khách sạn thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Khách sạn ABC',
          description: 'Tên khách sạn',
        },
        address: {
          type: 'string',
          example: '123 Đường ABC, Hà Nội',
          description: 'Địa chỉ khách sạn',
        },
        staff: {
          type: 'array',
          items: { type: 'string' },
          description: 'Danh sách ID nhân viên',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh khách sạn',
        },
      },
    },
  })
  async create(
    @Body() createHotelDto: CreateHotelDto,
    @Request() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ hotel: Hotel; message: string }> {
    if (file) {
      createHotelDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'hotels',
      );
    }

    const hotel = await this.hotelsService.create(
      createHotelDto,
      req.user.userId,
    );
    return {
      hotel,
      message: 'Tạo khách sạn thành công',
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Lấy danh sách khách sạn của người dùng hiện tại dựa theo role',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách khách sạn.',
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập.' })
  async findMyHotels(
    @Request() req: RequestWithUser,
  ): Promise<PopulatedHotel[]> {
    const { userId, role } = req.user;
    if (role === 'OWNER') {
      return this.hotelsService.findByOwner(userId);
    } else {
      return this.hotelsService.findByStaff(userId);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin khách sạn.',
  })
  @ApiResponse({ status: 404, description: 'Khách sạn không tồn tại.' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập khách sạn này.',
  })
  @ApiParam({ name: 'id', description: 'ID của khách sạn' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<PopulatedHotel> {
    const hotel = await this.hotelsService.findOne(id);

    const userId = req.user.userId;
    const hotelOwnerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = hotelOwnerId ? hotelOwnerId === userId : false;
    const isStaff = this.hotelsService.isUserStaffMember(hotel, userId);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin khách sạn này',
      );
    }

    return hotel;
  }

  @Get(':id/room-types')
  @ApiOperation({ summary: 'Lấy danh sách hạng phòng theo khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hạng phòng.',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  @ApiParam({ name: 'id', description: 'ID của khách sạn' })
  async getRoomTypes(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Kiểm tra xem người dùng có quyền truy cập khách sạn này không
    const hotel = await this.hotelsService.findOne(id);

    const userId = req.user.userId;
    const hotelOwnerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = hotelOwnerId ? hotelOwnerId === userId : false;
    const isStaff = this.hotelsService.isUserStaffMember(hotel, userId);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin khách sạn này',
      );
    }

    const hotelId = new mongoose.Types.ObjectId(id);
    return this.roomTypesService.findByHotelId(hotelId);
  }

  @Get(':id/rooms')
  @ApiOperation({ summary: 'Lấy danh sách phòng theo khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách phòng.',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  @ApiParam({ name: 'id', description: 'ID của khách sạn' })
  async getRooms(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Kiểm tra xem người dùng có quyền truy cập khách sạn này không
    const hotel = await this.hotelsService.findOne(id);

    const userId = req.user.userId;
    const hotelOwnerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = hotelOwnerId ? hotelOwnerId === userId : false;
    const isStaff = this.hotelsService.isUserStaffMember(hotel, userId);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin khách sạn này',
      );
    }

    const hotelId = new mongoose.Types.ObjectId(id);
    return this.roomsService.findByHotelId(hotelId);
  }
}
