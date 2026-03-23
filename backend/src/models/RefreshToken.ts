import { Schema, model, Types } from 'mongoose';
import crypto from 'crypto';

export interface IRefreshToken {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;      // SHA-256 of the actual token
  familyId: string;       // Groups all rotated descendants of one original token
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    isRevoked: { type: Boolean, default: false, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Static helper: hash a token string
RefreshTokenSchema.statics.hashToken = function (token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const RefreshToken = model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

// Utility
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
