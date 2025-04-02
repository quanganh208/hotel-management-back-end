import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.key');
    this.bucketName =
      this.configService.get<string>('supabase.bucket') || 'hotel-images';

    if (!supabaseUrl || !supabaseKey) {
      const error = new Error('Supabase URL hoặc Key không được định nghĩa');
      this.logger.error(error.message);
      throw error;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    file: Express.Multer.File,
    path: string = '',
  ): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}-${file.originalname.replace(/\s/g, '_')}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Lỗi khi upload file: ${error.message}`);
      }

      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Lỗi khi xử lý upload file: ${error.message}`);
        throw error;
      }
      const unknownError = new Error(
        `Lỗi không xác định khi upload file: ${String(error)}`,
      );
      this.logger.error(unknownError.message);
      throw unknownError;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Lỗi khi xóa file: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Lỗi khi xử lý xóa file: ${error.message}`);
        throw error;
      }
      const unknownError = new Error(
        `Lỗi không xác định khi xóa file: ${String(error)}`,
      );
      this.logger.error(unknownError.message);
      throw unknownError;
    }
  }
}
