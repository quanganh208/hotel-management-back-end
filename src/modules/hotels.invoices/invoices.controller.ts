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
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import mongoose from 'mongoose';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { RequestWithUser } from '@/types/express';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceStatus, InvoiceType } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AddInvoiceItemsDto } from './dto/add-invoice-items.dto';
import { HotelsService } from '../hotels/hotels.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Tạo hóa đơn mới (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo hóa đơn thành công.',
  })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    // Kiểm tra quyền truy cập khách sạn
    const hotel = await this.hotelsService.findOne(
      createInvoiceDto.hotelId.toString(),
    );

    // Kiểm tra quyền dựa vào vai trò
    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo hóa đơn cho khách sạn này',
      );
    }

    return this.invoicesService.create(createInvoiceDto, req.user.userId);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({
    summary:
      'Lấy danh sách hóa đơn theo khách sạn (OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT)',
  })
  @ApiQuery({
    name: 'hotelId',
    description: 'ID của khách sạn',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hóa đơn.',
  })
  async findAll(
    @Query('hotelId') hotelId: string,
    @Request() req: RequestWithUser,
  ): Promise<Invoice[]> {
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
        'Bạn không có quyền truy cập dữ liệu hóa đơn của khách sạn này',
      );
    }

    return this.invoicesService.findAll(new mongoose.Types.ObjectId(hotelId));
  }

  @Get('room/:roomId')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({
    summary:
      'Lấy danh sách hóa đơn theo phòng (OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT)',
  })
  @ApiParam({
    name: 'roomId',
    description: 'ID của phòng',
  })
  @ApiQuery({
    name: 'status',
    description: 'Trạng thái hóa đơn (open, paid, cancelled)',
    required: false,
    enum: InvoiceStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hóa đơn của phòng.',
  })
  async findByRoom(
    @Param('roomId') roomId: string,
    @Query('status') status: InvoiceStatus,
    @Request() req: RequestWithUser,
  ): Promise<Invoice[]> {
    const roomObjectId = new mongoose.Types.ObjectId(roomId);
    const invoices = await this.invoicesService.findByRoom(
      roomObjectId,
      status,
    );

    if (invoices.length > 0) {
      // Kiểm tra quyền truy cập dựa trên khách sạn của hóa đơn đầu tiên
      const hotelId = invoices[0].hotelId.toString();
      const hotel = await this.hotelsService.findOne(hotelId);

      const ownerId = this.hotelsService.extractOwnerId(hotel);
      const isOwner = ownerId === req.user.userId;
      const isStaff = this.hotelsService.isUserStaffMember(
        hotel,
        req.user.userId,
      );

      if (!isOwner && !isStaff) {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập dữ liệu hóa đơn của khách sạn này',
        );
      }
    }

    return invoices;
  }

  @Get('room/:roomId/active')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({
    summary:
      'Lấy hóa đơn đang mở của phòng (OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT)',
  })
  @ApiParam({
    name: 'roomId',
    description: 'ID của phòng',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về hóa đơn đang mở của phòng.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hóa đơn đang mở cho phòng này.',
  })
  async findActiveRoomInvoice(
    @Param('roomId') roomId: string,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    const roomObjectId = new mongoose.Types.ObjectId(roomId);
    const invoice =
      await this.invoicesService.findActiveRoomInvoice(roomObjectId);

    if (!invoice) {
      throw new NotFoundException(
        'Không tìm thấy hóa đơn đang mở cho phòng này',
      );
    }

    // Kiểm tra quyền truy cập
    const hotelId = invoice.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu hóa đơn của khách sạn này',
      );
    }

    return invoice;
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({
    summary:
      'Lấy thông tin chi tiết hóa đơn (OWNER, MANAGER, RECEPTIONIST, ACCOUNTANT)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hóa đơn',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin hóa đơn.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hóa đơn không tồn tại.',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    const objectId = new mongoose.Types.ObjectId(id);
    const invoice = await this.invoicesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = invoice.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin hóa đơn này',
      );
    }

    return invoice;
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Cập nhật thông tin hóa đơn (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hóa đơn',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật hóa đơn thành công.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hóa đơn không tồn tại.',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể cập nhật hóa đơn đã thanh toán hoặc đã hủy.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    const objectId = new mongoose.Types.ObjectId(id);
    const invoice = await this.invoicesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = invoice.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin hóa đơn này',
      );
    }

    // API này chỉ cho phép sửa hóa đơn đang mở
    if (invoice.status !== 'open') {
      throw new BadRequestException(
        'Chỉ có thể sửa hóa đơn có trạng thái "Đang mở"',
      );
    }

    return this.invoicesService.update(
      objectId,
      updateInvoiceDto,
      req.user.userId,
    );
  }

  @Post(':id/items')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Thêm mặt hàng/dịch vụ vào hóa đơn (OWNER, MANAGER, RECEPTIONIST)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hóa đơn',
  })
  @ApiResponse({
    status: 200,
    description: 'Thêm mặt hàng vào hóa đơn thành công.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hóa đơn không tồn tại.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Không thể thêm mặt hàng vào hóa đơn đã thanh toán hoặc đã hủy.',
  })
  async addItems(
    @Param('id') id: string,
    @Body() addItemsDto: AddInvoiceItemsDto,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    const objectId = new mongoose.Types.ObjectId(id);
    const invoice = await this.invoicesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = invoice.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isStaff = this.hotelsService.isUserStaffMember(
      hotel,
      req.user.userId,
    );

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin hóa đơn này',
      );
    }

    return this.invoicesService.addItems(
      objectId,
      addItemsDto,
      req.user.userId,
    );
  }

  @Post(':id/cancel')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Hủy hóa đơn (OWNER, MANAGER)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hóa đơn',
  })
  @ApiResponse({
    status: 200,
    description: 'Hủy hóa đơn thành công.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hóa đơn không tồn tại.',
  })
  @ApiResponse({
    status: 400,
    description: 'Hóa đơn đã được thanh toán hoặc đã hủy.',
  })
  async cancel(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    const objectId = new mongoose.Types.ObjectId(id);
    const invoice = await this.invoicesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = invoice.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException('Bạn không có quyền hủy hóa đơn này');
    }

    return this.invoicesService.cancel(objectId, req.user.userId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Xóa hóa đơn (OWNER, MANAGER)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của hóa đơn',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa hóa đơn thành công.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hóa đơn không tồn tại.',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa hóa đơn đã thanh toán.',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Invoice> {
    const objectId = new mongoose.Types.ObjectId(id);
    const invoice = await this.invoicesService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = invoice.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException('Bạn không có quyền xóa hóa đơn này');
    }

    return this.invoicesService.remove(objectId);
  }
}
