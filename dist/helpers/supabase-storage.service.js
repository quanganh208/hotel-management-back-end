"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupabaseStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseStorageService = SupabaseStorageService_1 = class SupabaseStorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SupabaseStorageService_1.name);
        const supabaseUrl = this.configService.get('supabase.url');
        const supabaseKey = this.configService.get('supabase.key');
        this.bucketName =
            this.configService.get('supabase.bucket') || 'hotel-images';
        if (!supabaseUrl || !supabaseKey) {
            const error = new Error('Supabase URL hoặc Key không được định nghĩa');
            this.logger.error(error.message);
            throw error;
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    async uploadFile(file, path = '') {
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
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Lỗi khi xử lý upload file: ${error.message}`);
                throw error;
            }
            const unknownError = new Error(`Lỗi không xác định khi upload file: ${String(error)}`);
            this.logger.error(unknownError.message);
            throw unknownError;
        }
    }
    async deleteFile(filePath) {
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([filePath]);
            if (error) {
                this.logger.error(`Lỗi khi xóa file: ${error.message}`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Lỗi khi xử lý xóa file: ${error.message}`);
                throw error;
            }
            const unknownError = new Error(`Lỗi không xác định khi xóa file: ${String(error)}`);
            this.logger.error(unknownError.message);
            throw unknownError;
        }
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = SupabaseStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseStorageService);
//# sourceMappingURL=supabase-storage.service.js.map