import { Request, Response, NextFunction } from 'express';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './schema';
import * as AuthService from './service';
import { successResponse } from '../../types/api';
import { ValidationError, AuthError } from '../../middleware/errorHandler';

// Cookie config for refresh token
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/v1/auth',
};

function getSecrets(_req: Request) {
  // Secrets injected at bootstrap via process.env after fetchSecrets()
  const jwtSecret = process.env.JWT_SECRET!;
  return { jwtSecret };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = RegisterSchema.safeParse(req.body);
    if (!input.success) throw new ValidationError('Invalid input', input.error.flatten().fieldErrors as Record<string, unknown>);

    const { jwtSecret } = getSecrets(req);
    const { user, tokens } = await AuthService.registerUser(input.data, jwtSecret);

    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json(successResponse({
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      accessToken: tokens.accessToken,
    }));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = LoginSchema.safeParse(req.body);
    if (!input.success) throw new ValidationError('Invalid input', input.error.flatten().fieldErrors as Record<string, unknown>);

    const { jwtSecret } = getSecrets(req);
    const { user, tokens } = await AuthService.loginUser(
      input.data.email,
      input.data.password,
      jwtSecret,
      { userAgent: req.headers['user-agent'], ip: req.ip }
    );

    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json(successResponse({
      user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      accessToken: tokens.accessToken,
    }));
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken as string | undefined;
    if (!rawToken) {
      next(new AuthError('No refresh token'));
      return;
    }

    const { jwtSecret } = getSecrets(req);
    const tokens = await AuthService.refreshTokens(
      rawToken, jwtSecret,
      { userAgent: req.headers['user-agent'], ip: req.ip }
    );

    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json(successResponse({ accessToken: tokens.accessToken }));
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.refreshToken as string | undefined;
    if (rawToken) await AuthService.logoutUser(rawToken);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) { next(new AuthError('Not authenticated')); return; }
    await AuthService.logoutAllDevices(req.user._id);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json(successResponse({ message: 'Logged out from all devices' }));
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = ForgotPasswordSchema.safeParse(req.body);
    if (!input.success) throw new ValidationError('Invalid input');
    await AuthService.initiatePasswordReset(input.data.email);
    // Always return same message (don't reveal if email exists)
    res.json(successResponse({ message: 'If that email is registered, a reset link has been sent' }));
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = ResetPasswordSchema.safeParse(req.body);
    if (!input.success) throw new ValidationError('Invalid input', input.error.flatten().fieldErrors as Record<string, unknown>);
    await AuthService.resetPassword(input.data.token, input.data.password);
    res.json(successResponse({ message: 'Password reset successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }); return; }
    const { User } = await import('../../models/User');
    const user = await User.findById(req.user._id).select('-password');
    if (!user) { next(new AuthError('User not found')); return; }
    res.json(successResponse({ user }));
  } catch (err) {
    next(err);
  }
}
