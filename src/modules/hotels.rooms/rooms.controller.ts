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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './schemas/room.schema';
import mongoose from 'mongoose';
import { UpdateRoomDto } from './dto/update-room.dto';
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

@ApiTags('rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({ summary: 'Tạo phòng mới (Chỉ dành cho OWNER)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo phòng thành công.',
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
        roomNumber: {
          type: 'string',
          example: '101',
          description: 'Số phòng',
        },
        roomTypeId: {
          type: 'string',
          example: '60d21b4667d0d8992e610c85',
          description: 'ID của hạng phòng',
        },
        floor: {
          type: 'string',
          example: '1',
          description: 'Tầng',
        },
        status: {
          type: 'string',
          example: 'available',
          description: 'Trạng thái phòng',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh phòng',
        },
      },
    },
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Room> {
    // Kiểm tra quyền OWNER
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ chủ khách sạn mới có quyền tạo phòng');
    }

    // Kiểm tra xem người dùng có phải là chủ của khách sạn này không
    const hotelId = createRoomDto.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo phòng cho khách sạn này',
      );
    }

    if (file) {
      createRoomDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'rooms',
      );
    }
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phòng theo khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách phòng.',
  })
  async findAll(
    @Query('hotelId') hotelId: string,
    @Request() req: RequestWithUser,
  ): Promise<Room[]> {
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
    return this.roomsService.findAll(hotelObjectId);
  }

  @Get('room-type/:roomTypeId')
  @ApiOperation({ summary: 'Lấy danh sách phòng theo hạng phòng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách phòng theo hạng phòng.',
  })
  @ApiParam({ name: 'roomTypeId', description: 'ID của hạng phòng' })
  async findByRoomTypeId(
    @Param('roomTypeId') roomTypeId: string,
    @Request() req: RequestWithUser,
  ): Promise<Room[]> {
    const roomTypeObjectId = new mongoose.Types.ObjectId(roomTypeId);

    // Trước tiên cần lấy thông tin về RoomType để biết nó thuộc hotel nào
    const rooms = await this.roomsService.findByRoomTypeId(roomTypeObjectId);

    if (rooms.length > 0) {
      const hotelId = rooms[0].hotelId.toString();
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
    }

    return rooms;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một phòng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin phòng.',
  })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Room> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
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

    return room;
  }

  @Patch(':id')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({ summary: 'Cập nhật thông tin phòng (Chỉ dành cho OWNER)' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phòng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Room> {
    // Kiểm tra quyền OWNER
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException(
        'Chỉ chủ khách sạn mới có quyền cập nhật phòng',
      );
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra xem người dùng có phải là chủ của khách sạn này không
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật phòng của khách sạn này',
      );
    }

    if (file) {
      updateRoomDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'rooms',
      );
    }

    return this.roomsService.update(objectId, updateRoomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phòng (Chỉ dành cho OWNER)' })
  @ApiResponse({
    status: 200,
    description: 'Xóa phòng thành công.',
  })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Room> {
    // Kiểm tra quyền OWNER
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ chủ khách sạn mới có quyền xóa phòng');
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra xem người dùng có phải là chủ của khách sạn này không
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa phòng của khách sạn này',
      );
    }

    return this.roomsService.remove(objectId);
  }
}
