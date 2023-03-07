import { Controller, Get, Logger } from '@nestjs/common';
// import { Role } from 'src/shared/casl/role.enum';
// import { Roles } from 'src/shared/rbac/roles.decorator';
import { NationalAPIService } from './national.api.service';

@Controller('')
export class NationalAPIController {
  constructor(
    private readonly appService: NationalAPIService,
    private readonly logger: Logger) {}

  @Get('ping')
  getHello(): string {
    this.logger.debug('Ping received debug')
    return this.appService.getHello();
  }
}
