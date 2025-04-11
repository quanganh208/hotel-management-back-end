import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { RoomType } from './schemas/room-type.schema';
import mongoose from 'mongoose';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithUser } from '@/types/express';
import { HotelsService } from '../hotels/hotels.service';
import { UploadInterceptor } from '@/helpers/upload.interceptor';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';

@ApiTags('room-types')
@ApiBearerAuth()
@Controller('room-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomTypesController {
  constructor(
    private readonly roomTypesService: RoomTypesService,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
  @Roles('OWNER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({ summary: 'Tạo hạng phòng mới (Chỉ dành cho OWNER)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo hạng phòng thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        hotelId: {
          type: 'string',
          example: '60d21b4667d0d8992e610c85',
          description: 'ID của khách sạn',
        },
        name: {
          type: 'string',
          example: 'Deluxe',
          description: 'Tên hạng phòng',
        },
        pricePerHour: {
          type: 'number',
          example: 200000,
          description: 'Giá theo giờ',
        },
        pricePerDay: {
          type: 'number',
          example: 500000,
          description: 'Giá theo ngày',
        },
        priceOvernight: {
          type: 'number',
          example: 800000,
          description: 'Giá qua đêm',
        },
        description: {
          type: 'string',
          example: 'Phòng Deluxe với view đẹp',
          description: 'Mô tả hạng phòng',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh hạng phòng',
        },
      },
    },
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() createRoomTypeDto: CreateRoomTypeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; data: RoomType }> {
    // Kiểm tra xem người dùng có phải là chủ của khách sạn này không
    const hotelId = createRoomTypeDto.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo hạng phòng cho khách sạn này',
      );
    }

    if (file) {
      createRoomTypeDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'room-types',
      );
    }

    const roomType = await this.roomTypesService.create(createRoomTypeDto);
    return {
      message: 'Tạo hạng phòng thành công',
      data: roomType,
    };
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Lấy danh sách hạng phòng theo khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hạng phòng.',
  })
  async findAll(
    @Query('hotelId') hotelId: string,
    @Request() req: RequestWithUser,
  ): Promise<RoomType[]> {
    // Kiểm tra xem người dùng có quyền truy cập khách sạn này không
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu của khách sạn này',
      );
    }

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    return this.roomTypesService.findAll(hotelObjectId);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một hạng phòng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin hạng phòng.',
  })
  @ApiResponse({ status: 404, description: 'Hạng phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của hạng phòng' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<RoomType> {
    const objectId = new mongoose.Types.ObjectId(id);
    const roomType = await this.roomTypesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = roomType.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu của khách sạn này',
      );
    }

    return roomType;
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({
    summary: 'Cập nhật thông tin hạng phòng (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật hạng phòng thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Hạng phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của hạng phòng' })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; data: RoomType }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const roomType = await this.roomTypesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = roomType.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin hạng phòng này',
      );
    }

    if (file) {
      updateRoomTypeDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'room-types',
      );
    }

    const updatedRoomType = await this.roomTypesService.update(
      objectId,
      updateRoomTypeDto,
    );
    return {
      message: 'Cập nhật hạng phòng thành công',
      data: updatedRoomType,
    };
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Xóa hạng phòng (Chỉ dành cho OWNER)' })
  @ApiResponse({ status: 200, description: 'Xóa hạng phòng thành công.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Hạng phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của hạng phòng' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const roomType = await this.roomTypesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = roomType.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Chỉ chủ khách sạn mới có quyền xóa hạng phòng',
      );
    }

    await this.roomTypesService.remove(objectId);
    return { message: 'Xóa hạng phòng thành công' };
  }
}
