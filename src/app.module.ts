import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthModule } from '@auth/auth.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { DiaryModule } from '@diary/diary.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { FoodModule } from '@food/food.module';
import { InMemoryEventBus } from '@common/events/in-memory-event-bus';
import { EventPublisherSymbol } from '@common/events/event-publisher.interface';
import { EventSubscriberSymbol } from '@common/events/event-subscriber.interface';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MetricsModule } from '@common/metrics/metrics.module';
import { MetricsMiddleware } from '@common/metrics/metrics.middleware';
import { AppConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // 설정 모듈
    AppConfigModule,

    // 이벤트 모듈
    EventEmitterModule.forRoot(),

    // Throttler 모듈
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttleConfig = configService.get('throttle');
        return [
          {
            name: 'short',
            ttl: throttleConfig.short.ttl,
            limit: throttleConfig.short.limit,
          },
          {
            name: 'medium',
            ttl: throttleConfig.medium.ttl,
            limit: throttleConfig.medium.limit,
          },
          {
            name: 'long',
            ttl: throttleConfig.long.ttl,
            limit: throttleConfig.long.limit,
          },
        ];
      },
    }),

    // 기능 모듈
    PrismaModule,
    AuthModule,
    DiaryModule,
    FoodModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: EventPublisherSymbol,
      useClass: InMemoryEventBus,
    },
    {
      provide: EventSubscriberSymbol,
      useClass: InMemoryEventBus,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
