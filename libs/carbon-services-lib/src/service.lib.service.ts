import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceLibService {
  getHello(): string {
    return 'Hello World!';
  }
}
