import { Injectable } from '@nestjs/common';
import { Event } from './event.interface';
import { EventPublisher } from './event-publisher.interface';
import { EventSubscriber } from './event-subscriber.interface';

@Injectable()
export class InMemoryEventBus implements EventPublisher, EventSubscriber {
  private handlers: {
    [eventName: string]: Array<(event: Event) => Promise<void>>;
  } = {};

  async publish(event: Event): Promise<void> {
    const handlers = this.handlers[event.name] || [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  subscribe(eventName: string, handler: (event: Event) => Promise<void>): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(handler);
  }
}
