import { NestFactory } from '@nestjs/core';
import { AnalyticsAPIModule } from './analytics-api/analytics.api.module';
import { NationalAPIModule } from './national-api/national.api.module';
import { buildNestApp } from './shared/server';

async function bootstrap() {
  const app = await buildNestApp(process.env.RUN_MODULE || NationalAPIModule, '/national')
  // await NestFactory.create(process.env.RUN_MODULE || NationalAPIModule);
  await app.listen(process.env.RUN_PORT || 3000);
}
bootstrap();
