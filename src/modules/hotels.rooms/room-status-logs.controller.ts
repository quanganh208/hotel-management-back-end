import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Request,
  ForbiddenException,
  forwardRef,
} from '@nestjs/common';
import { RoomStatusLogsService } from './room-status-logs.service';
import { RoomStatusLog } from './schemas/room-status-log.schema';
import mongoose from 'mongoose';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HotelsService } from '../hotels/hotels.service';
import { RequestWithUser } from '@/types/express';
import { RoomsService } from './rooms.service';

@ApiTags('room-status-logs')
@ApiBearerAuth()
@Controller('room-status-logs')
export class RoomStatusLogsController {
  constructor(
    private readonly roomStatusLogsService: RoomStatusLogsService,
    private readonly roomsService: RoomsService,
    @Inject(forwardRef(() => HotelsService))
    private readonly hotelsService: HotelsService,
  ) {}

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Lấy lịch sử trạng thái của một phòng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về lịch sử trạng thái phòng.',
  })
  @ApiParam({ name: 'roomId', description: 'ID của phòng' })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng bản ghi tối đa',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Vị trí bắt đầu',
    required: false,
    type: Number,
  })
  async findByRoomId(
    @Param('roomId') roomId: string,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
    @Request() req: RequestWithUser,
  ): Promise<RoomStatusLog[]> {
    const roomObjectId = new mongoose.Types.ObjectId(roomId);

    // Lấy thông tin phòng để kiểm tra quyền truy cập
    const room = await this.roomsService.findOne(roomObjectId);
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

    return this.roomStatusLogsService.findByRoomId(
      roomObjectId,
      parseInt(limit),
      parseInt(offset),
    );
  }

  @Get('hotel/:hotelId')
  @ApiOperation({ summary: 'Lấy lịch sử trạng thái phòng theo khách sạn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về lịch sử trạng thái phòng theo khách sạn.',
  })
  @ApiParam({ name: 'hotelId', description: 'ID của khách sạn' })
  @ApiQuery({
    name: 'limit',
    description: 'Số lượng bản ghi tối đa',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Vị trí bắt đầu',
    required: false,
    type: Number,
  })
  async findByHotelId(
    @Param('hotelId') hotelId: string,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
    @Request() req: RequestWithUser,
  ): Promise<RoomStatusLog[]> {
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
    return this.roomStatusLogsService.findByHotelId(
      hotelObjectId,
      parseInt(limit),
      parseInt(offset),
    );
  }
}
