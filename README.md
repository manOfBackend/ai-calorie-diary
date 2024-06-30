<p align="center">
  <img width="971" height="450" alt="image" src="https://github.com/manOfBackend/ai-calorie-diary/assets/74768098/4dd1a702-7e64-488d-900f-b490f2684564">
</p>

## 개요
이 프로젝트는 사용자가 음식 사진을 촬영하고 다이어리를 작성하면 AI를 통해 각 음식의 칼로리를 계산하여 식단 관리를 해주는 어플의 백엔드 시스템입니다.
[만들면서 배우는 클린 아키텍처 : 자바 코드로 구현하는 클린 웹 애플리케이션] 책을 학습하며 공부 목적으로 만들고 있습니다.
NestJS와 Effect-ts를 사용하여 구축되었으며, 클린 아키텍처와 도메인 주도 설계(Domain-Driven Design, DDD) 원칙을 따릅니다.

### 클린 아키텍처

이 프로젝트는 클린 아키텍처와 도메인 주도 설계 원칙을 따르고 있습니다. 주요 특징은 다음과 같습니다:

- **계층화된 아키텍처**: 프로젝트는 크게 어댑터, 애플리케이션, 도메인 계층으로 나누어져 있습니다.
    - **어댑터 계층**: 외부와의 인터페이스를 담당하며, REST API 컨트롤러와 데이터베이스 접근을 위한 어댑터가 위치합니다.
    - **애플리케이션 계층**: 비즈니스 로직을 처리하는 서비스와 포트가 위치합니다.
    - **도메인 계층**: 핵심 도메인 로직과 엔티티가 위치합니다.
- **의존성 역전**: 포트와 어댑터 패턴을 사용하여 상위 계층이 하위 계층에 의존하지 않도록 합니다.

### 인프라 구성

- **PostgreSQL**: Prisma ORM을 통해 데이터베이스로 사용됩니다.
- **Redis**: 자주 조회되는 데이터를 캐시하여 성능을 향상시킵니다.
- **RabbitMQ**: 비동기 작업 처리를 위한 메시지 큐로 사용됩니다.

## 프로젝트 구조
```
root
│
├── docker-compose.yml
├── package.json
├── prisma/
│   └── (Prisma ORM 설정 및 스키마 파일)
├── README.md
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/ (인증 모듈)
│   │   ├── adapter/
│   │   │   ├── in/
│   │   │   │   └── rest/
│   │   │   │       ├── auth.controller.ts
│   │   │   │       ├── auth.controller.spec.ts
│   │   │   │       └── dto/
│   │   │   │           ├── login.dto.ts
│   │   │   │           ├── register.dto.ts
│   │   │   │           └── refresh-token.dto.ts
│   │   │   └── out/
│   │   │       └── persistence/
│   │   │           └── user-repository.adapter.ts
│   │   ├── application/
│   │   │   ├── service/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.service.spec.ts
│   │   │   └── port/
│   │   │       ├── in/
│   │   │       │   ├── auth.use-case.ts
│   │   │       │   └── dto/
│   │   │       │       ├── login.command.ts
│   │   │       │       ├── register.command.ts
│   │   │       │       └── refresh-token.command.ts
│   │   │       └── out/
│   │   │           └── user-repository.port.ts
│   │   └── domain/
│   │       ├── refresh-token.ts
│   │       └── user.ts
│   ├── common/ (공통 모듈)
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── cache/ (캐시 모듈 - Redis)
│   │       ├── redis.service.ts
│   │       └── redis.module.ts
│   ├── messaging/ (메시징 모듈 - RabbitMQ)
│   │   ├── rabbitmq.service.ts
│   │   └── rabbitmq.module.ts
│   ├── user/ (사용자 관리 모듈)
│   │   ├── adapter/
│   │   │   ├── in/
│   │   │   │   └── rest/
│   │   │   │       ├── user.controller.ts
│   │   │   │       └── dto/
│   │   │   │           └── create-user.dto.ts
│   │   │   └── out/
│   │   │       └── persistence/
│   │   │           └── user-repository.adapter.ts
│   │   ├── application/
│   │   │   ├── service/
│   │   │   │   └── user.service.ts
│   │   │   └── port/
│   │   │       ├── in/
│   │   │       │   └── user.use-case.ts
│   │   │       └── out/
│   │   │           └── user-repository.port.ts
│   │   └── domain/
│   │       └── user.ts
│   ├── food/ (음식 인식 및 칼로리 계산 모듈)
│   │   ├── adapter/
│   │   │   ├── in/
│   │   │   │   └── rest/
│   │   │   │       ├── food.controller.ts
│   │   │   │       └── dto/
│   │   │   │           ├── food-image.dto.ts
│   │   │   │           ├── food-info.dto.ts
│   │   │   │           └── food-diary.dto.ts
│   │   │   └── out/
│   │   │       ├── persistence/
│   │   │       │   └── food-repository.adapter.ts
│   │   │       └── api/
│   │   │           └── gpt-api.adapter.ts
│   │   ├── application/
│   │   │   ├── service/
│   │   │   │   └── food.service.ts
│   │   │   └── port/
│   │   │       ├── in/
│   │   │       │   └── food.use-case.ts
│   │   │       └── out/
│   │   │           ├── food-repository.port.ts
│   │   │           └── gpt-api.port.ts
│   │   └── domain/
│   │       ├── food-image.ts
│   │       ├── food-info.ts
│   │       └── food-diary.ts
│   ├── diary/ (다이어리 모듈)
│   │   ├── adapter/
│   │   │   ├── in/
│   │   │   │   └── rest/
│   │   │   │       ├── diary.controller.ts
│   │   │   │       └── dto/
│   │   │   │           └── create-diary-entry.dto.ts
│   │   │   └── out/
│   │   │       └── persistence/
│   │   │           └── diary-repository.adapter.ts
│   │   ├── application/
│   │   │   ├── service/
│   │   │   │   └── diary.service.ts
│   │   │   └── port/
│   │   │       ├── in/
│   │   │       │   └── diary.use-case.ts
│   │   │       └── out/
│   │   │           └── diary-repository.port.ts
│   │   └── domain/
│   │       └── diary-entry.ts
├── test/
│   └── (테스트 코드)
├── tsconfig.build.json
└── tsconfig.json

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
