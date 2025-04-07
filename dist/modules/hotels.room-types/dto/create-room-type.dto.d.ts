import mongoose from 'mongoose';
export declare class CreateRoomTypeDto {
    hotelId: mongoose.Types.ObjectId;
    name: string;
    pricePerHour: number;
    pricePerDay: number;
    priceOvernight: number;
    description?: string;
    image?: string;
}
