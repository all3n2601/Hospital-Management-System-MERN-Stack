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

// Prevent updates and deletes at model level
AuditLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function() {
    throw new Error('AuditLog is append-only — updates and deletes are not permitted');
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
