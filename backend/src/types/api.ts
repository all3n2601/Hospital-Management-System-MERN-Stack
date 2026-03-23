export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function successResponse<T>(data: T, meta?: ApiSuccess<T>['meta']): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(code: string, message: string, details?: Record<string, unknown>): ApiError {
  return { success: false, error: { code, message, ...(details ? { details } : {}) } };
}
