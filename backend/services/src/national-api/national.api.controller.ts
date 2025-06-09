import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NationalAPIService } from './national.api.service';

@ApiTags('Default')
@Controller('')
export class NationalAPIController {
  constructor(
    private readonly appService: NationalAPIService,
    private readonly logger: Logger) {}

  @Get('ping')
  @ApiOperation({ summary: 'System health check'})
  @ApiResponse({ status: 200, description: 'Environment name' })
  getHello(): string {
    this.logger.debug('Ping received debug')
    return this.appService.getHello();
  }
}
