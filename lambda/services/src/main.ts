import { NestFactory } from '@nestjs/core';
import { AnalyticsAPIModule } from './analytics-api/analytics.api.module';
import { NationalAPIModule } from './national-api/national.api.module';
import { buildNestApp } from './shared/server';

async function bootstrap() {
  let module;
  let httpPath;
  switch (process.env.RUN_MODULE) {
    case 'national-api':
      module = NationalAPIModule;
      httpPath = 'national'
      break;
    case 'analytics-api':
      module = AnalyticsAPIModule;
      httpPath = 'stats'
      break;
    default:
      module = NationalAPIModule;
      httpPath = 'national'
  }

  const app = await buildNestApp(module, '/' + httpPath)
  await app.listen(process.env.RUN_PORT || 3000);
}
bootstrap();
