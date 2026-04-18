export const APP_BASE_URL = process.env.APP_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8081';
export const BACKEND_URL = process.env.BACKEND_URL ?? APP_BASE_URL;
