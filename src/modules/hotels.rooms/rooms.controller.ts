import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
  forwardRef,
  UseGuards,
  BadRequestException,
  NotFoundException,
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
import { UpdateRoomStatusWithNoteDto } from './dto/update-room-status-with-note.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { CheckInRoomDto } from './dto/check-in-room.dto';
import { WalkInCheckInDto } from './dto/walk-in-check-in.dto';
import { PaymentService } from '../hotels.payments/payment.service';
import { InvoicesService } from '../hotels.invoices/invoices.service';

@ApiTags('rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly supabaseStorageService: SupabaseStorageService,
    @Inject(forwardRef(() => HotelsService))
    private readonly hotelsService: HotelsService,
    private readonly paymentService: PaymentService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  @Roles('OWNER')
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
        note: {
          type: 'string',
          example: 'Phòng có view đẹp, hướng ra biển',
          description: 'Ghi chú về phòng',
        },
      },
    },
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; data: Room }> {
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
    const room = await this.roomsService.create(createRoomDto);
    return {
      message: 'Tạo phòng thành công',
      data: room,
    };
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
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
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
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
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
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
  @Roles('OWNER', 'MANAGER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({
    summary: 'Cập nhật thông tin phòng (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phòng thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; data: Room }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin phòng này',
      );
    }

    if (file) {
      updateRoomDto.image = await this.supabaseStorageService.uploadFile(
        file,
        'rooms',
      );
    }

    const updatedRoom = await this.roomsService.update(objectId, updateRoomDto);
    return {
      message: 'Cập nhật phòng thành công',
      data: updatedRoom,
    };
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Xóa phòng (Chỉ dành cho OWNER)' })
  @ApiResponse({ status: 200, description: 'Xóa phòng thành công.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException('Chỉ chủ khách sạn mới có quyền xóa phòng');
    }

    await this.roomsService.remove(objectId);
    return { message: 'Xóa phòng thành công' };
  }

  @Patch(':id/status')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING')
  @ApiOperation({
    summary:
      'Cập nhật trạng thái phòng (OWNER, MANAGER, RECEPTIONIST, HOUSEKEEPING)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái phòng thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateRoomStatusDto: UpdateRoomStatusWithNoteDto,
  ): Promise<{ message: string; data: Room }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff =
      ['MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING'].includes(req.user.role) &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật trạng thái phòng này',
      );
    }

    const updatedRoom = await this.roomsService.updateStatus(
      objectId,
      updateRoomStatusDto,
      req.user.userId,
    );
    return {
      message: 'Cập nhật trạng thái phòng thành công',
      data: updatedRoom,
    };
  }

  @Patch(':id/check-in')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary:
      'Đánh dấu phòng đã được nhận (check-in) bởi khách hàng (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái nhận phòng thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async checkInRoom(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() checkInRoomDto: CheckInRoomDto,
  ): Promise<{ message: string; data: Room }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isEligibleStaff =
      ['MANAGER', 'RECEPTIONIST'].includes(req.user.role) &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isEligibleStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện việc nhận phòng này',
      );
    }

    const updatedRoom = await this.roomsService.checkInRoom(
      objectId,
      checkInRoomDto,
      req.user.userId,
    );

    return {
      message: 'Cập nhật trạng thái nhận phòng thành công',
      data: updatedRoom,
    };
  }

  @Post(':id/walk-in-check-in')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Nhận phòng cho khách vãng lai không có đặt phòng trước',
  })
  @ApiResponse({
    status: 201,
    description: 'Nhận phòng thành công cho khách vãng lai.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc phòng không khả dụng.',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({ status: 404, description: 'Phòng không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  async walkInCheckIn(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() walkInCheckInDto: WalkInCheckInDto,
  ): Promise<{ message: string; data: { room: Room; booking: any } }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isEligibleStaff =
      ['MANAGER', 'RECEPTIONIST'].includes(req.user.role) &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isEligibleStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện việc nhận phòng cho khách vãng lai',
      );
    }

    const result = await this.roomsService.walkInCheckIn(
      objectId,
      walkInCheckInDto,
      req.user.userId,
    );

    return {
      message: 'Nhận phòng thành công cho khách vãng lai',
      data: result,
    };
  }

  @Post(':id/checkout')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Trả phòng và thanh toán hóa đơn (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả phòng và thanh toán hóa đơn thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện.' })
  @ApiResponse({
    status: 404,
    description: 'Phòng không tồn tại hoặc không ở trạng thái đang sử dụng.',
  })
  @ApiParam({ name: 'id', description: 'ID của phòng' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['paymentMethod'],
      properties: {
        paymentMethod: {
          type: 'string',
          enum: ['CASH', 'BANK_TRANSFER'],
          description:
            'Phương thức thanh toán: CASH (Tiền mặt) hoặc BANK_TRANSFER (Chuyển khoản)',
        },
        transactionReference: {
          type: 'string',
          description:
            'Mã giao dịch/tham chiếu (bắt buộc khi thanh toán bằng chuyển khoản)',
        },
        note: {
          type: 'string',
          description: 'Ghi chú thanh toán (tùy chọn)',
        },
      },
    },
  })
  async checkOutRoom(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body()
    checkoutDto: {
      paymentMethod: 'CASH' | 'BANK_TRANSFER';
      transactionReference?: string;
      note?: string;
    },
  ): Promise<any> {
    const objectId = new mongoose.Types.ObjectId(id);
    const room = await this.roomsService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = room.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isEligibleStaff =
      ['MANAGER', 'RECEPTIONIST'].includes(req.user.role) &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isEligibleStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện việc trả phòng này',
      );
    }

    // Kiểm tra thông tin thanh toán
    if (
      checkoutDto.paymentMethod === 'BANK_TRANSFER' &&
      !checkoutDto.transactionReference
    ) {
      throw new BadRequestException(
        'Vui lòng cung cấp mã giao dịch/tham chiếu cho thanh toán chuyển khoản',
      );
    }

    // Tạo thông tin thanh toán
    const paymentInfo = {
      method: checkoutDto.paymentMethod,
      reference: checkoutDto.transactionReference || '',
      note: checkoutDto.note || '',
    };

    const updatedRoom = await this.roomsService.checkOutRoom(
      objectId,
      JSON.stringify(paymentInfo),
      req.user.userId,
    );

    return {
      message: 'Trả phòng và thanh toán hóa đơn thành công',
      data: updatedRoom,
    };
  }
}
