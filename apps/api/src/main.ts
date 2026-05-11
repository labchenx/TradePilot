import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestFactory creates the HTTP application from the root module.
  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
