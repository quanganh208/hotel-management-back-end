import { RoomStatusLogsService } from './room-status-logs.service';
import { RoomStatusLog } from './schemas/room-status-log.schema';
import { HotelsService } from '../hotels/hotels.service';
import { RequestWithUser } from '@/types/express';
import { RoomsService } from './rooms.service';
export declare class RoomStatusLogsController {
    private readonly roomStatusLogsService;
    private readonly roomsService;
    private readonly hotelsService;
    constructor(roomStatusLogsService: RoomStatusLogsService, roomsService: RoomsService, hotelsService: HotelsService);
    findByRoomId(roomId: string, limit: string | undefined, offset: string | undefined, req: RequestWithUser): Promise<RoomStatusLog[]>;
    findByHotelId(hotelId: string, limit: string | undefined, offset: string | undefined, req: RequestWithUser): Promise<RoomStatusLog[]>;
}
