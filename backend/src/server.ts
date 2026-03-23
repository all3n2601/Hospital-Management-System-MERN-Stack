import http from 'http';
import { app } from './app';
import { connectDB, disconnectDB } from './db/mongoose';
import { connectRedis, disconnectRedis } from './db/redis';
import { initSocket } from './socket';
import { env } from './config/env';
import { logger } from './middleware/requestLogger';
import { fetchSecrets } from './config/secrets';

async function bootstrap() {
  const secrets = await fetchSecrets();

  // Set secrets on process.env for connectDB/connectRedis to use
  process.env.MONGODB_URI = secrets.MONGODB_URI;
  process.env.REDIS_URL = secrets.REDIS_URL;
  process.env.JWT_SECRET = secrets.JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET;

  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  initSocket(server, secrets.JWT_SECRET);

  server.listen(env.PORT, () => {
    logger.info(`HMS API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
