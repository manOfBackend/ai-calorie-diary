import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total')
    private httpRequestsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private httpRequestDuration: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const statusCode = res.statusCode.toString();

      this.httpRequestsCounter.inc({
        method,
        route: originalUrl,
        code: statusCode,
      });

      this.httpRequestDuration.observe(
        {
          method,
          route: originalUrl,
          code: statusCode,
        },
        duration / 1000,
      );
    });

    next();
  }
}
