import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BookingsService } from '../hotels.bookings/bookings.service';
import { InvoicesService } from '../hotels.invoices/invoices.service';
import { RoomsService } from '../hotels.rooms/rooms.service';
import { InventoryService } from '../hotels.inventory/inventory.service';
import { RoomStatusLogsService } from '../hotels.rooms/room-status-logs.service';
import mongoose from 'mongoose';
import { Invoice } from '../hotels.invoices/schemas/invoice.schema';
import { RoomStatus } from '../hotels.rooms/schemas/room.schema';

@Injectable()
export class DashboardService {
  constructor(
    private bookingsService: BookingsService,
    private invoicesService: InvoicesService,
    private roomsService: RoomsService,
    private inventoryService: InventoryService,
    private roomStatusLogsService: RoomStatusLogsService,
  ) {}

  // Thống kê doanh thu
  async getRevenueSummary(
    hotelId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ) {
    // Lấy tất cả hóa đơn của khách sạn
    const invoices = await this.invoicesService.findAll(hotelId);

    // MongoDB với timestamps sẽ tự động tạo createdAt, updatedAt
    // Nhưng TypeScript không nhận diện được, cần cast để sử dụng
    const filteredInvoices = invoices.filter((invoice: any) => {
      const invoiceCreatedAt = invoice.createdAt as Date;
      return invoiceCreatedAt >= startDate && invoiceCreatedAt <= endDate;
    });

    // Tổng doanh thu
    const totalRevenue = filteredInvoices.reduce(
      (sum, invoice) => sum + invoice.finalAmount,
      0,
    );

    // Doanh thu theo phương thức thanh toán
    const revenueByPaymentMethod = {};
    filteredInvoices.forEach((invoice) => {
      if (invoice.status === 'paid') {
        const method = invoice.paymentMethod || 'other';
        revenueByPaymentMethod[method] =
          (revenueByPaymentMethod[method] || 0) + invoice.finalAmount;
      }
    });

    // Doanh thu theo ngày
    const revenueByDate = {};
    filteredInvoices.forEach((invoice: any) => {
      if (invoice.status === 'paid') {
        const invoiceCreatedAt = invoice.createdAt as Date;
        const date = invoiceCreatedAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + invoice.finalAmount;
      }
    });

    // Số lượng hóa đơn theo trạng thái
    const invoiceCountByStatus = {
      paid: 0,
      open: 0,
      cancelled: 0,
    };

    filteredInvoices.forEach((invoice) => {
      invoiceCountByStatus[invoice.status]++;
    });

    return {
      totalRevenue,
      revenueByPaymentMethod,
      revenueByDate,
      invoiceCountByStatus,
      totalInvoices: filteredInvoices.length,
    };
  }

  // Thống kê phòng
  async getRoomStatistics(hotelId: mongoose.Types.ObjectId) {
    const rooms = await this.roomsService.findByHotelId(hotelId);

    // Phân loại phòng theo trạng thái
    const roomsByStatus = {
      [RoomStatus.AVAILABLE]: 0,
      [RoomStatus.OCCUPIED]: 0,
      [RoomStatus.BOOKED]: 0,
      [RoomStatus.CHECKED_IN]: 0,
      [RoomStatus.CHECKED_OUT]: 0,
      [RoomStatus.CLEANING]: 0,
      [RoomStatus.MAINTENANCE]: 0,
      [RoomStatus.OUT_OF_SERVICE]: 0,
      [RoomStatus.RESERVED]: 0,
    };

    rooms.forEach((room) => {
      if (roomsByStatus[room.status] !== undefined) {
        roomsByStatus[room.status]++;
      } else {
        // Xử lý trường hợp status không nằm trong enum
        roomsByStatus['unknown'] = (roomsByStatus['unknown'] || 0) + 1;
      }
    });

    // Tính tỷ lệ lấp đầy (Occupancy rate)
    // Phòng lấp đầy bao gồm: Đang có khách ở (OCCUPIED) và Khách đã nhận phòng (CHECKED_IN)
    const totalRooms = rooms.length;
    const occupiedRooms =
      (roomsByStatus[RoomStatus.OCCUPIED] || 0) +
      (roomsByStatus[RoomStatus.CHECKED_IN] || 0);
    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Lấy lịch sử thay đổi trạng thái phòng (10 bản ghi gần nhất)
    const recentStatusChanges = await this.roomStatusLogsService.findByHotelId(
      hotelId,
      10,
      0,
    );

    // Thông tin về loại phòng (tính theo phòng đã có)
    const roomsByType = {};
    rooms.forEach((room) => {
      // Kiểm tra và xử lý roomTypeId đúng cách để tránh sử dụng toàn bộ đối tượng làm khóa
      if (room.roomTypeId) {
        // Lấy ID của loại phòng
        let roomTypeId;
        if (typeof room.roomTypeId === 'string') {
          roomTypeId = room.roomTypeId;
        } else {
          // Xử lý cho trường hợp đã populate
          const roomTypeObj = room.roomTypeId as any;
          if (roomTypeObj && roomTypeObj._id) {
            roomTypeId = roomTypeObj._id.toString();
          } else {
            // Fallback: Chuyển đổi về string
            roomTypeId = roomTypeObj.toString();
          }
        }

        roomsByType[roomTypeId] = (roomsByType[roomTypeId] || 0) + 1;
      } else {
        // Nếu không có roomTypeId
        const unknownKey = 'unknown';
        roomsByType[unknownKey] = (roomsByType[unknownKey] || 0) + 1;
      }
    });

    return {
      totalRooms,
      occupiedRooms,
      occupancyRate,
      roomsByStatus,
      roomsByType,
      recentStatusChanges,
    };
  }

  // Thống kê tồn kho
  async getInventorySummary(
    hotelId: mongoose.Types.ObjectId,
    lowStockThreshold: number = 20,
  ) {
    return this.inventoryService.getSummary(hotelId, lowStockThreshold);
  }

  // Thống kê dữ liệu tổng quan
  async getDashboardOverview(
    hotelId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ) {
    // Lấy dữ liệu từ các dịch vụ khác nhau
    const [revenueSummary, roomStatistics, inventorySummary] =
      await Promise.all([
        this.getRevenueSummary(hotelId, startDate, endDate),
        this.getRoomStatistics(hotelId),
        this.getInventorySummary(hotelId),
      ]);

    // Lấy booking mới nhất
    const recentBookings = await this.bookingsService.findByHotelId(hotelId);

    // Giới hạn số lượng bookings trả về
    const limitedBookings = recentBookings.slice(0, 5);

    return {
      revenue: revenueSummary,
      rooms: roomStatistics,
      inventory: inventorySummary,
      recentActivities: {
        bookings: limitedBookings,
      },
    };
  }
}
