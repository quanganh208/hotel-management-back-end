import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { Hotel } from './schemas/hotel.schema';
import { RequestWithUser } from '@/types/express';
import { SupabaseStorageService } from '@/helpers/supabase-storage.service';
import { RoomTypesService } from '../hotels.room-types/room-types.service';
import { RoomsService } from '../hotels.rooms/rooms.service';
import { PopulatedHotel } from '@/types/mongoose.types';
export declare class HotelsController {
    private readonly hotelsService;
    private readonly supabaseStorageService;
    private readonly roomTypesService;
    private readonly roomsService;
    constructor(hotelsService: HotelsService, supabaseStorageService: SupabaseStorageService, roomTypesService: RoomTypesService, roomsService: RoomsService);
    create(createHotelDto: CreateHotelDto, req: RequestWithUser, file?: Express.Multer.File): Promise<{
        hotel: Hotel;
        message: string;
    }>;
    findMyHotels(req: RequestWithUser): Promise<PopulatedHotel[]>;
    findOne(id: string, req: RequestWithUser): Promise<PopulatedHotel>;
    getRoomTypes(id: string, req: RequestWithUser): Promise<import("../hotels.room-types/schemas/room-type.schema").RoomType[]>;
    getRooms(id: string, req: RequestWithUser): Promise<import("../hotels.rooms/schemas/room.schema").Room[]>;
}
