import { Event } from './event.interface';

export interface EventSubscriber {
  subscribe(eventName: string, handler: (event: Event) => Promise<void>): void;
}

export const EventSubscriberSymbol = Symbol('EventSubscriber');
