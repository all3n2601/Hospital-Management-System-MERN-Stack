import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../models/User';
import { RefreshToken, hashToken } from '../../models/RefreshToken';
import { AppError, AuthError, ConflictError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/requestLogger';

// Token config
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function generateAccessToken(user: IUser, jwtSecret: string): string {
  return jwt.sign(
    { _id: user._id.toString(), role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export async function registerUser(
  input: { firstName: string; lastName: string; email: string; password: string; phone?: string; dob?: string; gender?: string },
  jwtSecret: string
): Promise<{ user: IUser; tokens: TokenPair }> {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ConflictError('Email already registered');

  const user = await User.create({
    ...input,
    role: 'patient',
    dob: input.dob ? new Date(input.dob) : undefined,
  });

  // Create Patient profile (stubbed until Phase 2 — do a dynamic require to avoid circular dep)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patientModule = await import('../../models/Patient' as any);
    await patientModule.Patient.create({ userId: user._id });
  } catch {
    // Patient model not yet available (Phase 2) — skip silently
  }

  const tokens = await createTokenPair(user, jwtSecret);
  return { user, tokens };
}

export async function loginUser(
  email: string,
  password: string,
  jwtSecret: string,
  meta: { userAgent?: string; ip?: string }
): Promise<{ user: IUser; tokens: TokenPair }> {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AuthError('Invalid credentials');

  if (!user.isActive) throw new AuthError('Invalid credentials');

  if (user.isLocked()) {
    throw new AuthError('Account is temporarily locked due to too many failed login attempts');
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      logger.warn('Account locked', { email, failedAttempts: user.failedLoginAttempts });
    }
    await user.save();
    throw new AuthError('Invalid credentials');
  }

  // Reset failed attempts on success
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const tokens = await createTokenPair(user, jwtSecret, meta);
  return { user, tokens };
}

async function createTokenPair(
  user: IUser,
  jwtSecret: string,
  meta?: { userAgent?: string; ip?: string }
): Promise<TokenPair> {
  const rawRefreshToken = generateRefreshToken();
  const familyId = crypto.randomUUID();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefreshToken),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    userAgent: meta?.userAgent,
    ipAddress: meta?.ip,
  });

  const accessToken = generateAccessToken(user, jwtSecret);
  return { accessToken, refreshToken: rawRefreshToken };
}

export async function refreshTokens(
  rawToken: string,
  jwtSecret: string,
  meta?: { userAgent?: string; ip?: string }
): Promise<TokenPair> {
  const tokenHash = hashToken(rawToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) throw new AuthError('Invalid refresh token');

  // Reuse detection: if token is already revoked, invalidate entire family
  if (storedToken.isRevoked) {
    logger.warn('Refresh token reuse detected — revoking entire family', {
      familyId: storedToken.familyId,
      userId: storedToken.user.toString(),
    });
    await RefreshToken.updateMany({ familyId: storedToken.familyId }, { isRevoked: true });
    throw new AuthError('Refresh token reuse detected — please log in again');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AuthError('Refresh token expired');
  }

  // Revoke the used token
  storedToken.isRevoked = true;
  await storedToken.save();

  const user = await User.findById(storedToken.user);
  if (!user || !user.isActive) throw new AuthError('User not found or inactive');

  // Issue new token with same familyId for chain tracking
  const rawNewToken = generateRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawNewToken),
    familyId: storedToken.familyId, // same family — reuse detection traces the whole chain
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    userAgent: meta?.userAgent,
    ipAddress: meta?.ip,
  });

  const accessToken = generateAccessToken(user, jwtSecret);
  return { accessToken, refreshToken: rawNewToken };
}

export async function logoutUser(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await RefreshToken.updateMany({ user: userId, isRevoked: false }, { isRevoked: true });
}

export async function initiatePasswordReset(email: string): Promise<string> {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether email exists
    return 'If that email is registered, a reset link has been sent';
  }
  // Return reset token (caller sends email)
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Store hashed token in user record with 1h expiry
  // (reuse password field strategy: add passwordResetToken + passwordResetExpiry to schema)
  // For now, return token — email service wired in Phase 10
  return resetToken;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  // Stub — will be fully implemented when passwordResetToken field is added to User schema
  // For now just ensure token is non-empty
  if (!token) throw new AppError(400, 'INVALID_TOKEN', 'Invalid reset token');
  logger.info('Password reset stub called');
}
