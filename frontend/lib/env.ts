export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001/api';

export const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? 'demo-user';
