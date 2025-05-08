import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { DashboardService } from './dashboard.service';
import { HotelsService } from '../hotels/hotels.service';
import mongoose from 'mongoose';
import { RequestWithUser } from '@/types/express';
import {
  DashboardOverviewDto,
  RevenueSummaryDto,
  RoomStatisticsDto,
  InventorySummaryDto,
} from './dto/dashboard-summary.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private hotelsService: HotelsService,
  ) {}

  @Get('overview/:hotelId')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Lấy tổng quan về doanh thu, phòng, tồn kho và hoạt động gần đây',
  })
  @ApiParam({
    name: 'hotelId',
    description: 'ID của khách sạn',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về dữ liệu tổng quan của khách sạn.',
    type: DashboardOverviewDto,
  })
  async getOverview(
    @Param('hotelId') hotelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
  ): Promise<DashboardOverviewDto> {
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

    // Xác định khoảng thời gian (mặc định là 30 ngày gần nhất)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    return this.dashboardService.getDashboardOverview(
      hotelObjectId,
      start,
      end,
    );
  }

  @Get('revenue/:hotelId')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Lấy thống kê doanh thu',
  })
  @ApiParam({
    name: 'hotelId',
    description: 'ID của khách sạn',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thống kê doanh thu của khách sạn.',
    type: RevenueSummaryDto,
  })
  async getRevenueSummary(
    @Param('hotelId') hotelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
  ): Promise<RevenueSummaryDto> {
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

    // Xác định khoảng thời gian (mặc định là 30 ngày gần nhất)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const hotelObjectId = new mongoose.Types.ObjectId(hotelId);
    return this.dashboardService.getRevenueSummary(hotelObjectId, start, end);
  }

  @Get('rooms/:hotelId')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({
    summary: 'Lấy thống kê phòng',
  })
  @ApiParam({
    name: 'hotelId',
    description: 'ID của khách sạn',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thống kê phòng của khách sạn.',
    type: RoomStatisticsDto,
  })
  async getRoomStatistics(
    @Param('hotelId') hotelId: string,
    @Request() req: RequestWithUser,
  ): Promise<RoomStatisticsDto> {
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
    return this.dashboardService.getRoomStatistics(hotelObjectId);
  }

  @Get('inventory/:hotelId')
  @Roles('OWNER', 'MANAGER', 'HOUSEKEEPING')
  @ApiOperation({
    summary: 'Lấy thống kê tồn kho',
  })
  @ApiParam({
    name: 'hotelId',
    description: 'ID của khách sạn',
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
    description: 'Trả về thống kê tồn kho của khách sạn.',
    type: InventorySummaryDto,
  })
  async getInventorySummary(
    @Param('hotelId') hotelId: string,
    @Query('lowStockThreshold') lowStockThreshold: string,
    @Request() req: RequestWithUser,
  ): Promise<InventorySummaryDto> {
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
    return this.dashboardService.getInventorySummary(hotelObjectId, threshold);
  }
}
