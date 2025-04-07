"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadInterceptor = UploadInterceptor;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = require("multer");
function UploadInterceptor(fieldName = 'file') {
    let MulterInterceptor = class MulterInterceptor {
        async intercept(context, next) {
            const fileInterceptor = new ((0, platform_express_1.FileInterceptor)(fieldName, {
                storage: multer.memoryStorage(),
                limits: {
                    fileSize: 10 * 1024 * 1024,
                },
                fileFilter: (req, file, callback) => {
                    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                        return callback(new common_1.BadRequestException('Chỉ hỗ trợ file hình ảnh (jpg, jpeg, png, gif, webp)'), false);
                    }
                    callback(null, true);
                },
            }))();
            return fileInterceptor.intercept(context, next);
        }
    };
    MulterInterceptor = __decorate([
        (0, common_1.Injectable)()
    ], MulterInterceptor);
    return MulterInterceptor;
}
//# sourceMappingURL=upload.interceptor.js.map