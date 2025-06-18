import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyJwtAuthGuard extends AuthGuard(["jwt", "api-key"]) {

}