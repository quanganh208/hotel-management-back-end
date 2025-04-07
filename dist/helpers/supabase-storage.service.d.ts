import { ConfigService } from '@nestjs/config';
export declare class SupabaseStorageService {
    private configService;
    private readonly supabase;
    private readonly bucketName;
    private readonly logger;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File, path?: string): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
}
