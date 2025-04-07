import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './schemas/room.schema';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { RequestWithUser } from '@/types/express';
import { HotelsService } from '../hotels/hotels.service';
import { UpdateRoomStatusWithNoteDto } from './dto/update-room-status-with-note.dto';
export declare class RoomsController {
    private readonly roomsService;
    private readonly supabaseStorageService;
    private readonly hotelsService;
    constructor(roomsService: RoomsService, supabaseStorageService: SupabaseStorageService, hotelsService: HotelsService);
    create(req: RequestWithUser, createRoomDto: CreateRoomDto, file?: Express.Multer.File): Promise<{
        message: string;
        data: Room;
    }>;
    findAll(hotelId: string, req: RequestWithUser): Promise<Room[]>;
    findByRoomTypeId(roomTypeId: string, req: RequestWithUser): Promise<Room[]>;
    findOne(id: string, req: RequestWithUser): Promise<Room>;
    update(id: string, req: RequestWithUser, updateRoomDto: UpdateRoomDto, file?: Express.Multer.File): Promise<{
        message: string;
        data: Room;
    }>;
    remove(id: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
    updateStatus(id: string, req: RequestWithUser, updateRoomStatusDto: UpdateRoomStatusWithNoteDto): Promise<{
        message: string;
        data: Room;
    }>;
}
