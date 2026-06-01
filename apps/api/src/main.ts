import './load-env';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestFactory creates the HTTP application from the root module.
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // CORS_ORIGIN 环境变量优先
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',');
      if (allowedOrigins?.length) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      }

      // 开发模式：允许所有 localhost/127.0.0.1 来源
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4100);
  const host =
    process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

  await app.listen(port, host);
  logger.log(`API server listening on http://${host}:${port}`);
}

bootstrap();
