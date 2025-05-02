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
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { InventoryCheckService } from './inventory-check.service';
import { CreateInventoryCheckDto } from './dto/create-inventory-check.dto';
import { InventoryCheck } from './schemas/inventory-check.schema';
import mongoose from 'mongoose';
import { UpdateInventoryCheckDto } from './dto/update-inventory-check.dto';
import {
  ApiBearerAuth,
  ApiBody,
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

@ApiTags('inventory-checks')
@ApiBearerAuth()
@Controller('inventory-checks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryCheckController {
  constructor(
    private readonly inventoryCheckService: InventoryCheckService,
    @Inject(forwardRef(() => HotelsService))
    private readonly hotelsService: HotelsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Tạo phiếu kiểm kê mới (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo phiếu kiểm kê thành công.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        hotelId: {
          type: 'string',
          example: '60d21b4667d0d8992e610c85',
          description: 'ID của khách sạn',
        },
        note: {
          type: 'string',
          example: 'Kiểm kê hàng hóa định kỳ cuối tháng',
          description: 'Ghi chú',
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inventoryCode: {
                type: 'string',
                example: 'SP00001',
                description: 'Mã hàng hóa',
              },
              actualStock: {
                type: 'number',
                example: 95,
                description: 'Số lượng thực tế',
              },
            },
          },
          description: 'Danh sách mặt hàng kiểm kê',
        },
      },
    },
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() createInventoryCheckDto: CreateInventoryCheckDto,
  ): Promise<{ message: string; data: InventoryCheck }> {
    // Kiểm tra quyền truy cập
    const hotelId = createInventoryCheckDto.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo phiếu kiểm kê cho khách sạn này',
      );
    }

    const inventoryCheck = await this.inventoryCheckService.create(
      createInventoryCheckDto,
      req.user.userId,
    );
    return {
      message: 'Tạo phiếu kiểm kê thành công',
      data: inventoryCheck,
    };
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Lấy danh sách phiếu kiểm kê theo khách sạn' })
  @ApiQuery({
    name: 'hotelId',
    description: 'ID của khách sạn',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách phiếu kiểm kê.',
  })
  async findAll(
    @Request() req: RequestWithUser,
    @Query('hotelId') hotelId: string,
  ): Promise<InventoryCheck[]> {
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
    return this.inventoryCheckService.findAll(hotelObjectId);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một phiếu kiểm kê' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin phiếu kiểm kê.',
  })
  @ApiResponse({ status: 404, description: 'Phiếu kiểm kê không tồn tại.' })
  @ApiParam({ name: 'id', description: 'ID của phiếu kiểm kê' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<InventoryCheck> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryCheck = await this.inventoryCheckService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = inventoryCheck.hotelId.toString();
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

    return inventoryCheck;
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Cập nhật thông tin phiếu kiểm kê (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phiếu kiểm kê thành công.',
  })
  @ApiResponse({ status: 404, description: 'Phiếu kiểm kê không tồn tại.' })
  @ApiResponse({
    status: 403,
    description: 'Không thể cập nhật phiếu kiểm kê đã cân bằng.',
  })
  @ApiParam({ name: 'id', description: 'ID của phiếu kiểm kê' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        hotelId: {
          type: 'string',
          example: '60d21b4667d0d8992e610c85',
          description: 'ID của khách sạn',
        },
        note: {
          type: 'string',
          example: 'Kiểm kê hàng hóa định kỳ cuối tháng',
          description: 'Ghi chú',
        },
        status: {
          type: 'string',
          enum: ['draft', 'balanced'],
          example: 'balanced',
          description:
            'Trạng thái phiếu: "draft" (phiếu tạm) hoặc "balanced" (đã cân bằng kho)',
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inventoryCode: {
                type: 'string',
                example: 'SP00001',
                description: 'Mã hàng hóa',
              },
              actualStock: {
                type: 'number',
                example: 95,
                description: 'Số lượng thực tế',
              },
            },
          },
          description: 'Danh sách mặt hàng kiểm kê',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateInventoryCheckDto: UpdateInventoryCheckDto,
  ): Promise<{ message: string; data: InventoryCheck }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryCheck = await this.inventoryCheckService.findOne(objectId);

    // Kiểm tra xem phiếu kiểm kê có thuộc về khách sạn được chỉ định không
    if (
      inventoryCheck.hotelId.toString() !==
      updateInventoryCheckDto.hotelId.toString()
    ) {
      throw new ForbiddenException(
        'Phiếu kiểm kê này không thuộc về khách sạn được chỉ định',
      );
    }

    // Kiểm tra quyền truy cập
    const hotelId = updateInventoryCheckDto.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật thông tin phiếu kiểm kê này',
      );
    }

    const updatedCheck = await this.inventoryCheckService.update(
      objectId,
      updateInventoryCheckDto,
      req.user.userId,
    );
    return {
      message: 'Cập nhật phiếu kiểm kê thành công',
      data: updatedCheck,
    };
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Xóa phiếu kiểm kê (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({ status: 200, description: 'Xóa phiếu kiểm kê thành công.' })
  @ApiResponse({ status: 404, description: 'Phiếu kiểm kê không tồn tại.' })
  @ApiResponse({
    status: 403,
    description: 'Không thể xóa phiếu kiểm kê đã cân bằng.',
  })
  @ApiParam({ name: 'id', description: 'ID của phiếu kiểm kê' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryCheck = await this.inventoryCheckService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = inventoryCheck.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException('Bạn không có quyền xóa phiếu kiểm kê này');
    }

    await this.inventoryCheckService.remove(objectId);
    return { message: 'Xóa phiếu kiểm kê thành công' };
  }

  @Post(':id/balance')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({
    summary: 'Cân bằng kho từ phiếu kiểm kê (Chỉ dành cho OWNER và MANAGER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cân bằng kho thành công.',
  })
  @ApiResponse({ status: 404, description: 'Phiếu kiểm kê không tồn tại.' })
  @ApiResponse({
    status: 403,
    description: 'Phiếu kiểm kê đã được cân bằng trước đó.',
  })
  @ApiParam({ name: 'id', description: 'ID của phiếu kiểm kê' })
  async balanceInventory(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ message: string; data: InventoryCheck }> {
    const objectId = new mongoose.Types.ObjectId(id);
    const inventoryCheck = await this.inventoryCheckService.findOne(objectId);

    // Kiểm tra quyền truy cập
    const hotelId = inventoryCheck.hotelId.toString();
    const hotel = await this.hotelsService.findOne(hotelId);

    const ownerId = this.hotelsService.extractOwnerId(hotel);
    const isOwner = ownerId === req.user.userId;
    const isManager =
      req.user.role === 'MANAGER' &&
      this.hotelsService.isUserStaffMember(hotel, req.user.userId);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'Bạn không có quyền cân bằng kho cho khách sạn này',
      );
    }

    const balancedCheck = await this.inventoryCheckService.balanceInventory(
      objectId,
      req.user.userId,
    );

    return {
      message: 'Cân bằng kho thành công',
      data: balancedCheck,
    };
  }
}
