export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function toEnvelope<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return meta ? { data, meta } : { data };
}
