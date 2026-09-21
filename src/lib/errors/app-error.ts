export const APP_ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  INTERNAL: "INTERNAL",
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toErrorResponse(error: unknown): {
  ok: false;
  code: AppErrorCode;
  message: string;
  status: number;
} {
  if (isAppError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }

  return {
    ok: false,
    code: APP_ERROR_CODES.INTERNAL,
    message: "Настана неочекувана грешка.",
    status: 500,
  };
}
