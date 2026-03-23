import http from 'http';
import { app } from './app';
import { connectDB } from './db/mongoose';
import { connectRedis } from './db/redis';
import { initSocket } from './socket';
import { env } from './config/env';
import { logger } from './middleware/requestLogger';

async function bootstrap() {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`HMS API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
