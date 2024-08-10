import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      isGlobal: true,
    }),
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
