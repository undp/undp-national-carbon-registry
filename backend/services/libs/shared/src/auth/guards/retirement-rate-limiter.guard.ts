import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RetirementRateLimiterGuard implements CanActivate {
  private rateLimiter: RateLimiterMemory;

  constructor(private readonly configService: ConfigService) {
    const points = parseInt(this.configService.get<string>("rateLimiter.retirement.limit"), 10);
    const duration = parseInt(this.configService.get<string>("rateLimiter.retirement.duration"), 10);

    this.rateLimiter = new RateLimiterMemory({
      points,
      duration,
      keyPrefix: 'retirement-rate-limit',
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.ip;

    try {
      await this.rateLimiter.consume(key);
      return true;
    } catch (err) {
      throw new HttpException(
        {
          statusCode: 429,
          message: `Rate limit exceeded. Please try again later`,
        },
        429,
      );
    }
  }
}
