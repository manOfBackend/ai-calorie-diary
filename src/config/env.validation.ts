import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // 앱 설정
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),

  // 데이터베이스 설정
  DATABASE_URL: Joi.string().required(),

  // JWT 설정
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION_TIME: Joi.string().default('7d'),

  // AWS S3 설정
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET_NAME: Joi.string().required(),

  // OpenAI API 설정
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_ORG_ID: Joi.string().required(),
  OPENAI_PROJECT_ID: Joi.string().required(),
}).unknown(true);
