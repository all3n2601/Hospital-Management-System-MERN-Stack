import { Schema, model, Types } from 'mongoose';

export interface IAuditLog {
  actorId: Types.ObjectId;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    // Append-only: disable update and delete
    timestamps: false,
  }
);

// Compound index for common admin queries
AuditLogSchema.index({ resourceType: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });

// Prevent updates and deletes at model level (query middleware)
AuditLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'replaceOne'],
  function() {
    throw new Error('AuditLog is append-only — updates and deletes are not permitted');
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);

// Guard bulkWrite at the model level — mongoose does not support bulkWrite as a schema middleware
const originalBulkWrite = AuditLog.bulkWrite.bind(AuditLog);
AuditLog.bulkWrite = function(...args: Parameters<typeof originalBulkWrite>) {
  // Allow insertOne operations only; reject any write that mutates or deletes
  const ops = args[0] as Array<Record<string, unknown>>;
  const hasMutation = ops.some(op =>
    'updateOne' in op || 'updateMany' in op || 'replaceOne' in op ||
    'deleteOne' in op || 'deleteMany' in op
  );
  if (hasMutation) {
    return Promise.reject(new Error('AuditLog is append-only — updates and deletes are not permitted')) as ReturnType<typeof originalBulkWrite>;
  }
  return originalBulkWrite(...args);
} as typeof originalBulkWrite;
