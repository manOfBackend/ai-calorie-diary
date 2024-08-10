import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { finalize, Observable, tap } from 'rxjs';

export function DiaryPeriodMetric() {
  return applyDecorators(UseInterceptors(DiaryPeriodMetricInterceptor));
}

@Injectable()
export class DiaryPeriodMetricInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('diary_period_request_duration_seconds')
    private durationHistogram: Histogram<string>,
    @InjectMetric('diary_period_request_total')
    private requestCounter: Counter<string>,
    @InjectMetric('diary_period_request_in_flight')
    private inFlightGauge: Gauge<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.inFlightGauge.inc();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(start, 'success');
        },
        error: (error) => {
          this.recordMetrics(start, 'error', error.name);
        },
      }),
      finalize(() => {
        this.inFlightGauge.dec();
      }),
    );
  }

  private recordMetrics(startTime: number, status: string, error?: string) {
    const duration = (Date.now() - startTime) / 1000;
    this.durationHistogram.observe(
      { status, error: error || 'none' },
      duration,
    );
    this.requestCounter.inc({ status, error: error || 'none' });
  }
}
