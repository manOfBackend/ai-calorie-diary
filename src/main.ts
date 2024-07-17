import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('음식 칼로리 계산 API')
    .setDescription('음식 사진을 분석하여 칼로리를 계산하는 API')
    .setVersion('1.0')
    .addTag('food')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  document.components.schemas['ErrorResponse'] = {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      error: { type: 'string', example: 'Bad Request' },
      message: { type: 'string', example: 'Invalid input data' },
      errorCode: { type: 'string', example: 'INVALID_INPUT' },
      timestamp: { type: 'string', example: '2023-05-20T12:34:56.789Z' },
      path: { type: 'string', example: '/api/auth/login' },
    },
  };
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
