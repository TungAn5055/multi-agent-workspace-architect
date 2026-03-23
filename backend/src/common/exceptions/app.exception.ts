import { ErrorCode } from 'src/common/exceptions/error-codes';

export interface AppExceptionOptions {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export class AppException extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(options: AppExceptionOptions) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}
