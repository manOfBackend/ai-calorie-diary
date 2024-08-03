import { Event } from './event.interface';

export interface EventPublisher {
  publish(event: Event): Promise<void>;
}

export const EventPublisherSymbol = Symbol('EventPublisher');
