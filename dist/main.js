"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api', { exclude: [''] });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Hotel Management API')
        .setDescription('API cho hệ thống quản lý khách sạn với đầy đủ chức năng quản lý khách sạn, phòng, nhân viên, tài khoản và thanh toán.')
        .setVersion('1.0')
        .addTag('auth', 'Các API liên quan đến xác thực và quản lý tài khoản')
        .addTag('users', 'Các API quản lý người dùng')
        .addTag('hotels', 'Các API quản lý khách sạn')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT token',
        in: 'header',
    }, 'access-token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const customErrors = errors.map((error) => {
                if (error.constraints) {
                    for (const key in error.constraints) {
                        if (error.constraints[key] ===
                            `property ${error.property} should not exist`) {
                            return `Trường '${error.property}' không được phép tồn tại.`;
                        }
                    }
                }
                return Object.values(error.constraints ?? {}).join(', ');
            });
            return new common_1.BadRequestException(customErrors);
        },
    }));
    await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
//# sourceMappingURL=main.js.map