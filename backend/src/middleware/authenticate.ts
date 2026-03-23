import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from './errorHandler';

interface JwtPayload {
  _id: string;
  role: string;
  email: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    next(new AuthError('No token provided'));
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    next(new AuthError('Server configuration error'));
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = { _id: payload._id, role: payload.role as 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient' };
    next();
  } catch (err) {
    next(new AuthError('Invalid or expired token'));
  }
}
