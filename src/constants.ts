// CORE
export const PORT = parseInt(process.env.PORT!);
export const BASE_PATH = process.env.BASE_PATH!;
export const CLIENT_URL = process.env.CLIENT_URL!;

// DATABASE
export const MONGO_URI = process.env.MONGO_URI!;

export const REDIS_URI = process.env.REDIS_URI!;

// LOG
export const LOG_FOLDER = process.env.LOG_FOLDER ?? "logs";
export const ERROR_LOG_FILE = process.env.ERROR_LOG_FILE ?? "error.log";
export const REQUEST_LOG_FILE = process.env.REQUEST_LOG_FILE ?? "request.log";

// GOOGLE AUTH
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// GIAO HANG NHANH
export const GHN_SHOP_ID = process.env.GHN_SHOP_ID!;
export const GHN_API_TOKEN = process.env.GHN_API_TOKEN!;

// PAYOS
export const PAYOS_API_KEY = process.env.PAYOS_API_KEY!;
export const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID!;
export const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY!;
