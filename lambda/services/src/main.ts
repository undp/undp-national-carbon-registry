import { NestFactory } from '@nestjs/core';
import { AnalyticsAPIModule } from './analytics-api/analytics.api.module';
import { NationalAPIModule } from './national-api/national.api.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsAPIModule);
  app.setGlobalPrefix('/api/analytics')
  await app.listen(3000);
}
bootstrap();
