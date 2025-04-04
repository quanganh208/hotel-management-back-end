import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

export function UploadInterceptor(fieldName: string = 'file') {
  @Injectable()
  class MulterInterceptor implements NestInterceptor {
    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const fileInterceptor = new (FileInterceptor(fieldName, {
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            return callback(
              new BadRequestException(
                'Chỉ hỗ trợ file hình ảnh (jpg, jpeg, png, gif, webp)',
              ),
              false,
            );
          }
          callback(null, true);
        },
      }))();

      return fileInterceptor.intercept(context, next);
    }
  }

  return MulterInterceptor;
}
