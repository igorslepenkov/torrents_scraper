import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const PORT = config.get<string>('port');

  await app.listen(PORT);
  console.log(`App is listening on port ${PORT}`);
}
bootstrap();
