import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

const httpRequestsCounter = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'],
});

const httpRequestDuration = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const diaryPeriodRequestDuration = makeHistogramProvider({
  name: 'diary_period_request_duration_seconds',
  help: 'Duration of /diary/period GET requests in seconds',
  labelNames: ['status', 'error'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const diaryPeriodRequestTotal = makeCounterProvider({
  name: 'diary_period_request_total',
  help: 'Total number of /diary/period GET requests',
  labelNames: ['status', 'error'],
});

const diaryPeriodRequestInFlight = makeGaugeProvider({
  name: 'diary_period_request_in_flight',
  help: 'Number of /diary/period GET requests currently being processed',
});

@Module({
  imports: [
    PrometheusModule.register({
      path: '/api/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    httpRequestsCounter,
    httpRequestDuration,
    diaryPeriodRequestDuration,
    diaryPeriodRequestTotal,
    diaryPeriodRequestInFlight,
  ],
  exports: [
    PrometheusModule,
    httpRequestsCounter,
    httpRequestDuration,
    diaryPeriodRequestDuration,
    diaryPeriodRequestTotal,
    diaryPeriodRequestInFlight,
  ],
})
export class MetricsModule {}
