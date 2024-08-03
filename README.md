<p align="center">
  <img width="571" alt="image" src="https://github.com/manOfBackend/ai-calorie-diary/assets/74768098/4dd1a702-7e64-488d-900f-b490f2684564">
</p>

## Overview
This project is the backend system of an application that allows users to take photos of food and keep a diary. The AI calculates the calories of each food item to help users manage their diet. This project is being created for learning purposes while studying the book [Clean Architecture: A Craftsman's Guide to Software Structure and Design] by Robert C. Martin, and it is built using NestJS, adhering to clean architecture and Domain-Driven Design (DDD) principles.

## Architecture

This project follows clean architecture principles and is designed as a microservices architecture. The system is composed of loosely coupled modules that communicate via events, promoting scalability and maintainability. Key architectural features include:

- **Hexagonal Architecture**: Each module is structured using the hexagonal (ports and adapters) pattern, separating core business logic from external concerns.
- **Event-Driven Communication**: Modules communicate asynchronously through events, using an in-memory event bus for local communication and Kafka for distributed event processing.
- **Microservices**: The application is divided into distinct services (auth, user, food, diary) that can be deployed and scaled independently.
- **Domain-Driven Design (DDD)**: Business logic is organized around domain concepts, with clear boundaries between different contexts.

## Project Structure


```
src/
├── main.ts
├── app.module.ts
├── auth/
│   ├── adapter/
│   │   ├── in/
│   │   │   └── rest/
│   │   │       ├── dto/
│   │   │       ├── auth.controller.spec.ts
│   │   │       └── auth.controller.ts
│   │   └── out/
│   │       └── persistence/
│   │           └── user-repository.adapter.ts
│   ├── application/
│   │   ├── port/
│   │   │   ├── in/
│   │   │   │   ├── dto/
│   │   │   │   └── auth.use-case.ts
│   │   │   └── out/
│   │   │       └── user-repository.port.ts
│   │   └── service/
│   │       ├── auth.service.spec.ts
│   │       └── auth.service.ts
│   ├── domain/
│   │   ├── refresh-token.ts
│   │   └── user.ts
│   └── auth.module.ts
├── common/
│   ├── decorators/
│   │   └── user.decorator.ts
│   ├── dto/
│   ├── events/
│   │   ├── event.interface.ts
│   │   ├── event-publisher.interface.ts
│   │   ├── event-subscriber.interface.ts
│   │   └── in-memory-event-bus.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── kafka/
│   ├── logger/
│   │   └── custom-logger.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── s3/
│   │   └── s3.service.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── diary/
│   ├── adapter/
│   │   ├── in/
│   │   │   └── rest/
│   │   │       ├── dto/
│   │   │       ├── diary.controller.ts
│   │   │       └── swagger.decorator.ts
│   │   └── out/
│   │       └── persistence/
│   │           └── diary-repository.adapter.ts
│   ├── application/
│   │   ├── event-handlers/
│   │   │   └── food-analyzed.handler.ts
│   │   ├── port/
│   │   │   ├── in/
│   │   │   │   └── diary.use-case.ts
│   │   │   └── out/
│   │   │       └── diary-repository.port.ts
│   │   └── service/
│   │       ├── diary.service.spec.ts
│   │       └── diary.service.ts
│   ├── domain/
│   │   └── diary.ts
│   └── diary.module.ts
├── food/
│   ├── adapter/
│   │   ├── in/
│   │   │   └── rest/
│   │   │       ├── dto/
│   │   │       │   └── food-analysis.dto.ts
│   │   │       ├── food.controller.ts
│   │   │       └── swagger.decorator.ts
│   │   └── out/
│   │       └── api/
│   │           └── openai-api.adapter.ts
│   ├── application/
│   │   ├── port/
│   │   │   ├── in/
│   │   │   │   └── food.use-case.ts
│   │   │   └── out/
│   │   │       └── openai-api.port.ts
│   │   └── service/
│   │       └── food.service.ts
│   ├── domain/
│   │   ├── events/
│   │   │   └── food-analyzed.event.ts
│   │   └── food-analysis.ts
│   └── food.module.ts
└── user/
    ├── adapter/
    │   ├── in/
    │   │   └── rest/
    │   │       ├── dto/
    │   │       └── user.controller.ts
    │   └── out/
    │       └── persistence/
    │           └── user-repository.adapter.ts
    ├── application/
    │   ├── port/
    │   │   ├── in/
    │   │   │   └── user.use-case.ts
    │   │   └── out/
    │   │       └── user-repository.port.ts
    │   └── service/
    │       └── user.service.ts
    ├── domain/
    │   └── user.ts
    └── user.module.ts
   
```

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```


## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

```
