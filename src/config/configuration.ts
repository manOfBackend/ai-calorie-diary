export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME,
    refreshExpirationTime: process.env.JWT_REFRESH_EXPIRATION_TIME,
  },

  aws: {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
    },
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID,
    projectId: process.env.OPENAI_PROJECT_ID,
  },

  throttle: {
    short: {
      ttl: 1000,
      limit: 3,
    },
    medium: {
      ttl: 10000,
      limit: 20,
    },
    long: {
      ttl: 60000,
      limit: 100,
    },
  },
});
