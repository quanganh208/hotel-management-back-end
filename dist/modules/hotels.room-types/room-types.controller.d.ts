import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { RoomType } from './schemas/room-type.schema';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { RequestWithUser } from '@/types/express';
import { HotelsService } from '../hotels/hotels.service';
export declare class RoomTypesController {
    private readonly roomTypesService;
    private readonly supabaseStorageService;
    private readonly hotelsService;
    constructor(roomTypesService: RoomTypesService, supabaseStorageService: SupabaseStorageService, hotelsService: HotelsService);
    create(req: RequestWithUser, createRoomTypeDto: CreateRoomTypeDto, file?: Express.Multer.File): Promise<{
        message: string;
        data: RoomType;
    }>;
    findAll(hotelId: string, req: RequestWithUser): Promise<RoomType[]>;
    findOne(id: string, req: RequestWithUser): Promise<RoomType>;
    update(id: string, req: RequestWithUser, updateRoomTypeDto: UpdateRoomTypeDto, file?: Express.Multer.File): Promise<{
        message: string;
        data: RoomType;
    }>;
    remove(id: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
}
