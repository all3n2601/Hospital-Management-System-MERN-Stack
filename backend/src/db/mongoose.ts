import mongoose from 'mongoose';
import { logger } from '../middleware/requestLogger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDB(uri?: string): Promise<void> {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/hms';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      logger.warn(`MongoDB connection attempt ${attempt} failed — retrying in ${RETRY_DELAY_MS}ms`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}
