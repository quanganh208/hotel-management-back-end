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

@ApiTags('room-types')
@ApiBearerAuth()
@Controller('room-types')
export class RoomTypesController {
  constructor(
    private readonly roomTypesService: RoomTypesService,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
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
  ): Promise<RoomType> {
    // Kiểm tra quyền OWNER
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Chỉ chủ khách sạn mới có quyền tạo hạng phòng',
      );
    }

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

    return this.roomTypesService.create(createRoomTypeDto);
  }

  @Get()
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
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({
    summary: 'Cập nhật thông tin hạng phòng (Chỉ dành cho OWNER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật hạng phòng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Hạng phòng không tồn tại.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của hạng phòng' })
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<RoomType> {
    // Kiểm tra quyền OWNER
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Chỉ chủ khách sạn mới có quyền cập nhật hạng phòng',
      );
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const roomType = await this.roomTypesService.findOne(objectId);

    // Kiểm tra xem người dùng có phải là chủ của khách sạn này không
    const hotelId = roomType.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật hạng phòng của khách sạn này',
      );
    }

    if (file) {
      updateRoomTypeDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'room-types',
      );
    }

    return this.roomTypesService.update(objectId, updateRoomTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hạng phòng (Chỉ dành cho OWNER)' })
  @ApiResponse({
    status: 200,
    description: 'Xóa hạng phòng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Hạng phòng không tồn tại.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiParam({ name: 'id', description: 'ID của hạng phòng' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<RoomType> {
    // Kiểm tra quyền OWNER
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Chỉ chủ khách sạn mới có quyền xóa hạng phòng',
      );
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const roomType = await this.roomTypesService.findOne(objectId);

    // Kiểm tra xem người dùng có phải là chủ của khách sạn này không
    const hotelId = roomType.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa hạng phòng của khách sạn này',
      );
    }

    return this.roomTypesService.remove(objectId);
  }
}
