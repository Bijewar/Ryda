/**
 * Standard API response shape — every JSON endpoint returns this envelope.
 *
 * Success: { data: T, error: null, meta: { ... } }
 * Failure: { data: null, error: { code, message, fieldErrors? }, meta: { requestId } }
 */
export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  data: null;
  error: ApiError;
  meta: ApiMeta;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Per-field validation errors, when the code is `VALIDATION_ERROR`. */
  fieldErrors?: Record<string, string[]>;
  /** Optional stack/hint for development. Stripped in production. */
  hint?: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  /** Cursor pagination — opaque, pass back as `?cursor=X`. */
  cursor?: string;
  /** Total count when applicable. */
  total?: number;
  /** Items returned in this page. */
  count?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_CREDENTIALS'
  | 'OTP_REQUIRED'
  | 'OTP_INVALID'
  | 'TWO_FACTOR_REQUIRED'
  | 'OUTSIDE_SERVICE_AREA'
  | 'NO_DRIVERS_AVAILABLE'
  | 'INVALID_STATE_TRANSITION'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_ALREADY_PROCESSED'
  | 'WEBHOOK_INVALID'
  | 'INTERNAL_ERROR';

/** Helper: build a success response. */
export function ok<T>(data: T, meta?: Partial<ApiMeta>): ApiSuccessResponse<T> {
  return {
    data,
    error: null,
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/** Helper: build an error response. */
export function error(
  code: ApiErrorCode,
  message: string,
  extra?: { fieldErrors?: Record<string, string[]>; hint?: string },
): ApiErrorResponse {
  return {
    data: null,
    error: { code, message, ...extra },
    meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
  };
}

/** HTTP status code for a given ApiErrorCode. */
export function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
    case 'INVALID_CREDENTIALS':
    case 'OTP_REQUIRED':
    case 'OTP_INVALID':
    case 'TWO_FACTOR_REQUIRED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
    case 'INVALID_STATE_TRANSITION':
    case 'PAYMENT_ALREADY_PROCESSED':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    case 'ACCOUNT_LOCKED':
      return 423;
    case 'OUTSIDE_SERVICE_AREA':
    case 'NO_DRIVERS_AVAILABLE':
    case 'PAYMENT_FAILED':
    case 'WEBHOOK_INVALID':
      return 422;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}
