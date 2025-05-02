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
  UseGuards,
  UseInterceptors,
  forwardRef,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { InventoryItem } from './schemas/inventory-item.schema';
import mongoose from 'mongoose';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithUser } from '@/types/express';
import { HotelsService } from '../hotels/hotels.service';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { UploadInterceptor } from '@/helpers/upload.interceptor';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly supabaseStorageService: SupabaseStorageService,
    @Inject(forwardRef(() => HotelsService))
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({ summary: 'Tạo hàng hóa mới (Chỉ dành cho OWNER và MANAGER)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo hàng hóa thành công.',
  })
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
          example: 'Nước suối',
          description: 'Tên hàng hóa',
        },
        unit: {
          type: 'string',
          example: 'chai',
          description: 'Đơn vị',
        },
        sellingPrice: {
          type: 'number',
          example: 15000,
          description: 'Giá bán',
        },
        costPrice: {
          type: 'number',
          example: 10000,
          description: 'Giá vốn',
        },
        stock: {
          type: 'number',
          example: 100,
          description: 'Số lượng tồn kho',
        },
        itemType: {
          type: 'string',
          example: 'beverage',
          description: 'Loại hàng hóa',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh hàng hóa',
        },
        description: {
          type: 'string',
          example: 'Nước suối tinh khiết 500ml',
          description: 'Mô tả hàng hóa',
        },
      },
    },
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; data: InventoryItem }> {
    // Kiểm tra quyền truy cập
    const hotelId = createInventoryItemDto.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền thêm hàng hóa cho khách sạn này',
      );
    }

    // Upload ảnh nếu có
    if (file) {
      createInventoryItemDto.image =
        await this.supabaseStorageService.uploadFile(file, 'inventory');
    }

    const inventoryItem = await this.inventoryService.create(
      createInventoryItemDto,
    );
    return {
      message: 'Tạo hàng hóa thành công',
      data: inventoryItem,
    };
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Lấy danh sách hàng hóa theo khách sạn và thông tin tổng hợp',
  })
  @ApiQuery({
    name: 'hotelId',
    description: 'ID của khách sạn',
    required: true,
  })
  @ApiQuery({
    name: 'lowStockThreshold',
    description:
      'Ngưỡng số lượng tồn kho thấp để cảnh báo sản phẩm sắp hết hàng',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin tổng hợp và danh sách hàng hóa.',
  })
  async findAll(
    @Request() req: RequestWithUser,
    @Query('hotelId') hotelId: string,
    @Query('lowStockThreshold') lowStockThreshold?: string,
  ): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categoryCount: number;
    items: InventoryItem[];
  }> {
    // Kiểm tra quyền truy cập
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
    const threshold = lowStockThreshold ? parseInt(lowStockThreshold) : 20;
    return this.inventoryService.getSummary(hotelObjectId, threshold);
  }

  @Get('search')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Tìm kiếm hàng hóa theo mã hoặc tên' })
  @ApiQuery({
    name: 'hotelId',
    description: 'ID của khách sạn',
    required: true,
  })
  @ApiQuery({
    name: 'query',
    description: 'Từ khóa tìm kiếm (mã hoặc tên hàng hóa)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hàng hóa phù hợp với từ khóa tìm kiếm.',
  })
  async searchItems(
    @Request() req: RequestWithUser,
    @Query('hotelId') hotelId: string,
    @Query('query') query: string,
  ): Promise<InventoryItem[]> {
    try {
      // Kiểm tra quyền truy cập
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

      // Gọi service để tìm kiếm - truyền thẳng hotelId dạng string để service xử lý
      return this.inventoryService.searchItems(hotelId, query);
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  @Get('code/:code')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một hàng hóa theo mã' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin hàng hóa.',
  })
  @ApiResponse({ status: 404, description: 'Hàng hóa không tồn tại.' })
  @ApiParam({ name: 'code', description: 'Mã hàng hóa' })
  async findByCode(
    @Param('code') code: string,
    @Request() req: RequestWithUser,
  ): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryService.findByInventoryCode(code);

    // Kiểm tra quyền truy cập
    const hotelId = inventoryItem.hotelId.toString();
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

    return inventoryItem;
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một hàng hóa' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin hàng hóa.',
  })
  @ApiResponse({ status: 404, description: 'Hàng hóa không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của hàng hóa' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<InventoryItem> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryItem = await this.inventoryService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = inventoryItem.hotelId.toString();
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

    return inventoryItem;
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @UseInterceptors(UploadInterceptor('image'))
  @ApiOperation({
    summary: 'Cập nhật thông tin hàng hóa (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật hàng hóa thành công.',
  })
  @ApiResponse({ status: 404, description: 'Hàng hóa không tồn tại.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        hotelId: {
          type: 'string',
          example: '60d21b4667d0d8992e610c85',
          description: 'ID của khách sạn (bắt buộc)',
        },
        inventoryCode: {
          type: 'string',
          example: 'SP00001',
          description: 'Mã hàng hóa',
        },
        name: {
          type: 'string',
          example: 'Nước suối',
          description: 'Tên hàng hóa',
        },
        unit: {
          type: 'string',
          example: 'chai',
          description: 'Đơn vị',
        },
        sellingPrice: {
          type: 'number',
          example: 15000,
          description: 'Giá bán',
        },
        costPrice: {
          type: 'number',
          example: 10000,
          description: 'Giá vốn',
        },
        stock: {
          type: 'number',
          example: 100,
          description: 'Số lượng tồn kho',
        },
        itemType: {
          type: 'string',
          example: 'beverage',
          description: 'Loại hàng hóa',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Hình ảnh hàng hóa',
        },
        description: {
          type: 'string',
          example: 'Nước suối tinh khiết 500ml',
          description: 'Mô tả hàng hóa',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; data: InventoryItem }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryItem = await this.inventoryService.findOne(objectId);

    // Kiểm tra xem hàng hóa có thuộc về khách sạn được chỉ định không
    if (
      inventoryItem.hotelId.toString() !==
      updateInventoryItemDto.hotelId.toString()
    ) {
      throw new ForbiddenException(
        'Hàng hóa này không thuộc về khách sạn được chỉ định',
      );
    }

    // Kiểm tra quyền truy cập
    const hotelId = updateInventoryItemDto.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin hàng hóa này',
      );
    }

    // Upload ảnh nếu có
    if (file) {
      updateInventoryItemDto.image =
        await this.supabaseStorageService.uploadFile(file, 'inventory');
    }

    const updatedItem = await this.inventoryService.update(
      objectId,
      updateInventoryItemDto,
    );
    return {
      message: 'Cập nhật hàng hóa thành công',
      data: updatedItem,
    };
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Xóa hàng hóa (Chỉ dành cho OWNER)' })
  @ApiResponse({ status: 200, description: 'Xóa hàng hóa thành công.' })
  @ApiResponse({ status: 404, description: 'Hàng hóa không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của hàng hóa' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryItem = await this.inventoryService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = inventoryItem.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    if (ownerId !== req.user.userId) {
      throw new ForbiddenException(
        'Chỉ chủ khách sạn mới có quyền xóa hàng hóa',
      );
    }

    await this.inventoryService.remove(objectId);
    return { message: 'Xóa hàng hóa thành công' };
  }
}
