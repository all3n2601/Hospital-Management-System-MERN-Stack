import cron from 'node-cron';
import { Appointment } from '../models/Appointment';
import { logger } from '../middleware/requestLogger';

// Run every hour — cancel scheduled appointments not confirmed within 24h
export function startAppointmentJobs() {
  cron.schedule('0 * * * *', async () => {
    if (process.env.NODE_ENV === 'test') return;

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Appointment.updateMany(
      { status: 'scheduled', createdAt: { $lt: cutoff } },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: null,
          cancelReason: 'Auto-cancelled: not confirmed within 24 hours',
        },
      }
    );
    if (result.modifiedCount > 0) {
      logger.info(`Auto-cancelled ${result.modifiedCount} unconfirmed appointments`);
    }
  });
}
