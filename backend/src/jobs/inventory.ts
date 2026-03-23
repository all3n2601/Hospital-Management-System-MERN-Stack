import cron from 'node-cron';
import { InventoryItem } from '../models/InventoryItem';
import { emitToRole } from '../socket';
import { logger } from '../middleware/requestLogger';

export function startInventoryJobs() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    if (process.env.NODE_ENV === 'test') return;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      // Find items expiring within 30 days (but not already expired)
      const expiringItems = await InventoryItem.find({
        expiryDate: { $gt: now, $lte: thirtyDaysFromNow },
      }).lean();

      for (const item of expiringItems) {
        const expiryDate = item.expiryDate!;
        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        emitToRole('admin', 'inventory:expiring-soon', {
          itemId: item._id.toString(),
          itemName: item.name,
          expiryDate,
          daysRemaining,
        });
      }

      // Find already expired items
      const expiredItems = await InventoryItem.find({
        expiryDate: { $lt: now },
      }).lean();

      for (const item of expiredItems) {
        emitToRole('admin', 'inventory:expired', {
          itemId: item._id.toString(),
          itemName: item.name,
          expiryDate: item.expiryDate,
        });
      }

      if (expiringItems.length > 0 || expiredItems.length > 0) {
        logger.info(
          `Inventory expiry check: ${expiringItems.length} expiring soon, ${expiredItems.length} expired`
        );
      }
    } catch (err) {
      logger.error('Inventory expiry job error:', { error: (err as Error).message });
    }
  });
}
