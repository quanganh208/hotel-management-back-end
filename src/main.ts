import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  app.setGlobalPrefix('api', { exclude: [''] });

  const config = new DocumentBuilder()
    .setTitle('Hotel Management API')
    .setDescription(
      'API cho hệ thống quản lý khách sạn với đầy đủ chức năng quản lý khách sạn, phòng, nhân viên, tài khoản và thanh toán.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Các API liên quan đến xác thực và quản lý tài khoản')
    .addTag('users', 'Các API quản lý người dùng')
    .addTag('hotels', 'Các API quản lý khách sạn')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      exceptionFactory: (errors) => {
        const customErrors = errors.map((error) => {
          if (error.constraints) {
            for (const key in error.constraints) {
              if (
                error.constraints[key] ===
                `property ${error.property} should not exist`
              ) {
                return `Trường '${error.property}' không được phép tồn tại.`;
              }
            }
          }

          return Object.values(error.constraints ?? {}).join(', ');
        });

        return new BadRequestException(customErrors);
      },
    }),
  );

  await app.listen(process.env.PORT ?? 8000);
}

void bootstrap();
