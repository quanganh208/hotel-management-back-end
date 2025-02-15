import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const customErrors = errors.map((error) => {
          if (error.constraints) {
            for (const key in error.constraints) {
              if (
                error.constraints[key] ===
                `property ${error.property} should not exist`
              ) {
                return {
                  property: error.property,
                  message: `Trường '${error.property}' không được phép tồn tại.`,
                };
              }
            }
          }

          return {
            property: error.property,
            message: Object.values(error.constraints ?? {}).join(', '),
          };
        });

        return new BadRequestException(customErrors);
      },
    }),
  );

  app.setGlobalPrefix('api', { exclude: [''] });
  await app.listen(process.env.PORT ?? 8000);
}

void bootstrap();
