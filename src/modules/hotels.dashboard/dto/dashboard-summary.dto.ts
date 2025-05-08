import { ApiProperty } from '@nestjs/swagger';

export class RevenueSummaryDto {
  @ApiProperty({ description: 'Tổng doanh thu' })
  totalRevenue: number;

  @ApiProperty({ description: 'Doanh thu theo phương thức thanh toán' })
  revenueByPaymentMethod: Record<string, number>;

  @ApiProperty({ description: 'Doanh thu theo ngày' })
  revenueByDate: Record<string, number>;

  @ApiProperty({ description: 'Số lượng hóa đơn theo trạng thái' })
  invoiceCountByStatus: {
    paid: number;
    open: number;
    cancelled: number;
  };

  @ApiProperty({ description: 'Tổng số hóa đơn' })
  totalInvoices: number;
}

export class RoomStatisticsDto {
  @ApiProperty({ description: 'Tổng số phòng' })
  totalRooms: number;

  @ApiProperty({ description: 'Số phòng đang được sử dụng' })
  occupiedRooms: number;

  @ApiProperty({ description: 'Tỷ lệ lấp đầy (%)' })
  occupancyRate: number;

  @ApiProperty({ description: 'Số lượng phòng theo trạng thái' })
  roomsByStatus: Record<string, number>;

  @ApiProperty({ description: 'Số lượng phòng theo loại phòng' })
  roomsByType: Record<string, number>;

  @ApiProperty({ description: 'Lịch sử thay đổi trạng thái phòng gần đây' })
  recentStatusChanges: any[];
}

export class InventorySummaryDto {
  @ApiProperty({ description: 'Tổng số mặt hàng' })
  totalItems: number;

  @ApiProperty({ description: 'Tổng giá trị kho' })
  totalValue: number;

  @ApiProperty({ description: 'Số mặt hàng sắp hết' })
  lowStockItems: number;

  @ApiProperty({ description: 'Số danh mục sản phẩm' })
  categoryCount: number;

  @ApiProperty({ description: 'Danh sách mặt hàng' })
  items: any[];
}

export class DashboardOverviewDto {
  @ApiProperty({ description: 'Thống kê doanh thu' })
  revenue: RevenueSummaryDto;

  @ApiProperty({ description: 'Thống kê phòng' })
  rooms: RoomStatisticsDto;

  @ApiProperty({ description: 'Thống kê tồn kho' })
  inventory: InventorySummaryDto;

  @ApiProperty({ description: 'Hoạt động gần đây' })
  recentActivities: {
    bookings: any[];
  };
}
