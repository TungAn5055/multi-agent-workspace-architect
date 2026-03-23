export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    timestamp?: string;
  };
}

export class ApiError extends Error {
  code: string;
  details?: unknown;
  requestId?: string;

  constructor(payload: ApiErrorPayload['error']) {
    super(payload.message);
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}
